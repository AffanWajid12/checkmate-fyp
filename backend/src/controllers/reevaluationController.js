import prisma from "../config/prismaClient.js";
import { handleError } from "../utils/courseHelpers.js";

/**
 * POST /api/reevaluation/request
 * Body: { submissionId, reason }
 * Student only — requests re-evaluation of a graded submission.
 * The teacher_id is auto-resolved from the course ownership chain.
 */
export const requestReevaluation = async (req, res) => {
    try {
        const { submissionId, reason } = req.body;
        const studentId = req.user.id;

        if (!submissionId) {
            return res.status(400).json({ message: "submissionId is required" });
        }

        // 1. Get the submission and verify it belongs to this student
        const submission = await prisma.submissions.findUnique({
            where: { id: submissionId },
            include: {
                assessment: {
                    include: {
                        announcement: {
                            include: {
                                course: true,
                            },
                        },
                    },
                },
                reevaluation_request: true,
            },
        });

        if (!submission || submission.user_id !== studentId) {
            return res.status(404).json({ message: "Submission not found" });
        }

        // 2. Must be GRADED to request re-evaluation
        if (submission.status !== "GRADED") {
            return res.status(400).json({ message: "Only graded submissions can be re-evaluated" });
        }

        // 3. Check FR1: only one request per submission (also enforced by @unique)
        if (submission.reevaluation_request) {
            return res.status(409).json({ message: "A re-evaluation request already exists for this submission" });
        }

        // 4. Auto-resolve teacher_id from course ownership chain
        const teacherId = submission.assessment.announcement.course.teacher_id;

        // 5. Create the request
        const reevalRequest = await prisma.reevaluation_requests.create({
            data: {
                submission_id: submissionId,
                student_id: studentId,
                teacher_id: teacherId,
                student_reason: reason || null,
            },
        });

        return res.status(201).json({
            message: "Re-evaluation request submitted successfully",
            request: reevalRequest,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * GET /api/reevaluation/student/my-requests
 * Student only — returns all re-evaluation requests for the logged-in student.
 */
export const getStudentRequests = async (req, res) => {
    try {
        const requests = await prisma.reevaluation_requests.findMany({
            where: { student_id: req.user.id },
            include: {
                submission: {
                    include: {
                        assessment: {
                            select: { id: true, title: true, type: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            message: "Student re-evaluation requests retrieved",
            requests,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * GET /api/reevaluation/teacher/pending
 * Teacher only — returns all pending re-evaluation requests for courses owned by this teacher.
 */
export const getTeacherPendingRequests = async (req, res) => {
    try {
        const requests = await prisma.reevaluation_requests.findMany({
            where: {
                teacher_id: req.user.id,
                status: "PENDING",
            },
            include: {
                student: {
                    select: { id: true, name: true, email: true, profile_picture: true },
                },
                submission: {
                    include: {
                        assessment: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                announcement: {
                                    select: {
                                        course: {
                                            select: { id: true, title: true, code: true },
                                        },
                                    },
                                },
                            },
                        },
                        evaluation: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            message: "Pending re-evaluation requests retrieved",
            requests,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * GET /api/reevaluation/teacher/all
 * Teacher only — returns ALL re-evaluation requests (all statuses) for this teacher.
 */
export const getTeacherAllRequests = async (req, res) => {
    try {
        const requests = await prisma.reevaluation_requests.findMany({
            where: {
                teacher_id: req.user.id,
            },
            include: {
                student: {
                    select: { id: true, name: true, email: true, profile_picture: true },
                },
                submission: {
                    include: {
                        assessment: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                announcement: {
                                    select: {
                                        course: {
                                            select: { id: true, title: true, code: true },
                                        },
                                    },
                                },
                            },
                        },
                        evaluation: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            message: "All re-evaluation requests retrieved",
            requests,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * PATCH /api/reevaluation/teacher/respond/:requestId
 * Body: { action: "ACCEPTED" | "REJECTED", teacherNote?: string }
 * Teacher only — accepts or rejects a re-evaluation request.
 * If ACCEPTED: resets the submission grade, status, and clears the evaluation.
 */
export const respondToRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action, teacherNote } = req.body;

        if (!["ACCEPTED", "REJECTED"].includes(action)) {
            return res.status(400).json({ message: "action must be 'ACCEPTED' or 'REJECTED'" });
        }

        // 1. Get the request and verify ownership
        const reevalRequest = await prisma.reevaluation_requests.findUnique({
            where: { id: requestId },
            include: {
                submission: true,
            },
        });

        if (!reevalRequest) {
            return res.status(404).json({ message: "Re-evaluation request not found" });
        }

        if (reevalRequest.teacher_id !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to respond to this request" });
        }

        if (reevalRequest.status !== "PENDING") {
            return res.status(400).json({ message: `Request has already been ${reevalRequest.status.toLowerCase()}` });
        }

        if (action === "REJECTED") {
            // Simple rejection — just update the status and note
            const updated = await prisma.reevaluation_requests.update({
                where: { id: requestId },
                data: {
                    status: "REJECTED",
                    teacher_note: teacherNote || null,
                },
            });

            return res.status(200).json({
                message: "Re-evaluation request rejected",
                request: updated,
            });
        }

        // 2. ACCEPTED — reset the submission in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update request status
            const updatedRequest = await tx.reevaluation_requests.update({
                where: { id: requestId },
                data: {
                    status: "ACCEPTED",
                    teacher_note: teacherNote || null,
                },
            });

            // Reset the submission grade and status
            await tx.submissions.update({
                where: { id: reevalRequest.submission_id },
                data: {
                    grade: null,
                    feedback: null,
                    status: "SUBMITTED",
                },
            });

            // Delete the existing evaluation if it exists
            await tx.evaluations.deleteMany({
                where: { submission_id: reevalRequest.submission_id },
            });

            return updatedRequest;
        });

        return res.status(200).json({
            message: "Re-evaluation request accepted. Submission has been reset for re-grading.",
            request: result,
        });
    } catch (error) {
        return handleError(res, error);
    }
};
