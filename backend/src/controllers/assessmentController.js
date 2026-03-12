import prisma from "../config/prismaClient.js";
import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
import {
    handleError,
    verifyCourseOwner,
    verifyStudentEnrolled,
    verifyAssessmentInCourse,
    generateSignedUrl,
} from "../utils/courseHelpers.js";

// POST /api/courses/:courseId/announcements/:announcementId/assessments
// Body (multipart/form-data): title, type, instructions?, due_date?, files[]
export const addAssessment = async (req, res) => {
    try {
        const { courseId, announcementId } = req.params;
        const { title, type, instructions, due_date } = req.body;

        if (!title || !type)
            return res.status(400).json({ message: "title and type are required" });

        await verifyCourseOwner(courseId, req.user.id);

        // Verify the announcement belongs to this course
        const announcement = await prisma.announcements.findUnique({
            where: { id: announcementId },
        });
        if (!announcement || announcement.course_id !== courseId)
            return res.status(404).json({ message: "Announcement not found in this course" });

        // Create the assessment record
        const assessment = await prisma.assessments.create({
            data: {
                title,
                type,
                instructions: instructions ?? null,
                due_date: due_date ? new Date(due_date) : null,
                announcement_id: announcementId,
            },
        });

        // Upload any source material files to Supabase Storage
        const uploadedMaterials = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const ext = file.originalname.split(".").pop();
                const storagePath = `${courseId}/${assessment.id}/${uuidv4()}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from("source-materials")
                    .upload(storagePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false,
                    });

                if (uploadError)
                    throw { status: 500, message: `File upload failed: ${uploadError.message}` };

                const material = await prisma.source_materials.create({
                    data: {
                        bucket_path: storagePath,
                        file_name: file.originalname,
                        file_size: file.size,
                        mime_type: file.mimetype,
                        assessment_id: assessment.id,
                    },
                });
                uploadedMaterials.push(material);
            }
        }

        return res.status(201).json({
            message: "Assessment created successfully",
            assessment,
            source_materials: uploadedMaterials,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/courses/:courseId/assessments/:assessmentId
// Teacher: gets assessment details + student submission lists (submitted/late/not_submitted)
// Student: gets assessment details + own submission
export const getAssessmentDetails = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        const assessment = await verifyAssessmentInCourse(assessmentId, courseId);

        // Generate signed URLs for all source materials
        const materialsWithUrls = await Promise.all(
            (assessment.source_materials ?? []).map(async (m) => ({
                ...m,
                signed_url: await generateSignedUrl("source-materials", m.bucket_path),
            }))
        );

        if (req.user.role === "TEACHER") {
            await verifyCourseOwner(courseId, req.user.id);

            // Get all enrolled students for this course
            const enrollments = await prisma.enrollments.findMany({
                where: { course_id: courseId },
                include: { student: { select: { id: true, name: true, email: true } } },
            });

            // Get all submissions for this assessment
            const submissions = await prisma.submissions.findMany({
                where: { assessment_id: assessmentId },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            });

            const submittedIds = new Set(submissions.map((s) => s.user_id));

            const submitted = submissions.filter((s) => s.status === "SUBMITTED" || s.status === "GRADED");
            const late = submissions.filter((s) => s.status === "LATE");
            const notSubmitted = enrollments
                .filter((e) => !submittedIds.has(e.student_id))
                .map((e) => e.student);

            return res.status(200).json({
                message: "Assessment details retrieved successfully",
                assessment: { ...assessment, source_materials: materialsWithUrls },
                submitted,
                late,
                not_submitted: notSubmitted,
            });
        } else {
            await verifyStudentEnrolled(courseId, req.user.id);

            const submission = await prisma.submissions.findUnique({
                where: {
                    user_id_assessment_id: {
                        user_id: req.user.id,
                        assessment_id: assessmentId,
                    },
                },
                include: { attachments: true },
            });

            // Generate signed URLs for submission attachments if they exist
            let submissionWithUrls = null;
            if (submission) {
                const attachmentsWithUrls = await Promise.all(
                    submission.attachments.map(async (a) => ({
                        ...a,
                        signed_url: await generateSignedUrl("submission-files", a.bucket_path),
                    }))
                );
                submissionWithUrls = { ...submission, attachments: attachmentsWithUrls };
            }

            return res.status(200).json({
                message: "Assessment details retrieved successfully",
                assessment: { ...assessment, source_materials: materialsWithUrls },
                submission: submissionWithUrls,
            });
        }
    } catch (error) {
        return handleError(res, error);
    }
};

// POST /api/courses/:courseId/assessments/:assessmentId/submit
// Body (multipart/form-data): files[]
export const submitAssessment = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        await verifyStudentEnrolled(courseId, req.user.id);
        const assessment = await verifyAssessmentInCourse(assessmentId, courseId);

        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "At least one file is required" });

        // Check for duplicate submission
        const existing = await prisma.submissions.findUnique({
            where: {
                user_id_assessment_id: {
                    user_id: req.user.id,
                    assessment_id: assessmentId,
                },
            },
        });
        if (existing)
            return res.status(409).json({ message: "Already submitted. Use PATCH to update." });

        // Determine SUBMITTED vs LATE
        const now = new Date();
        const isLate = assessment.due_date && now > assessment.due_date;
        const status = isLate ? "LATE" : "SUBMITTED";

        // Create submission record
        const submission = await prisma.submissions.create({
            data: {
                user_id: req.user.id,
                assessment_id: assessmentId,
                status,
                submitted_at: now,
            },
        });

        // Upload files to Supabase Storage
        const uploadedAttachments = [];
        for (const file of req.files) {
            const ext = file.originalname.split(".").pop();
            const storagePath = `${courseId}/${assessmentId}/${submission.id}/${uuidv4()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("submission-files")
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false,
                });

            if (uploadError)
                throw { status: 500, message: `File upload failed: ${uploadError.message}` };

            const attachment = await prisma.attachments.create({
                data: {
                    bucket_path: storagePath,
                    file_name: file.originalname,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    submission_id: submission.id,
                },
            });
            uploadedAttachments.push(attachment);
        }

        return res.status(201).json({
            message: `Assessment submitted successfully${isLate ? " (late)" : ""}`,
            submission,
            attachments: uploadedAttachments,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// PATCH /api/courses/:courseId/assessments/:assessmentId/submit
// Appends more files to an existing submission; blocked if already GRADED
export const updateSubmission = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        await verifyStudentEnrolled(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "At least one file is required" });

        const submission = await prisma.submissions.findUnique({
            where: {
                user_id_assessment_id: {
                    user_id: req.user.id,
                    assessment_id: assessmentId,
                },
            },
        });

        if (!submission)
            return res.status(404).json({ message: "No submission found. Use POST to submit first." });

        if (submission.status === "GRADED")
            return res.status(403).json({ message: "Submission has been graded and cannot be modified." });

        // Upload new files and append attachments
        const uploadedAttachments = [];
        for (const file of req.files) {
            const ext = file.originalname.split(".").pop();
            const storagePath = `${courseId}/${assessmentId}/${submission.id}/${uuidv4()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("submission-files")
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false,
                });

            if (uploadError)
                throw { status: 500, message: `File upload failed: ${uploadError.message}` };

            const attachment = await prisma.attachments.create({
                data: {
                    bucket_path: storagePath,
                    file_name: file.originalname,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    submission_id: submission.id,
                },
            });
            uploadedAttachments.push(attachment);
        }

        // Touch the updatedAt timestamp
        const updated = await prisma.submissions.update({
            where: { id: submission.id },
            data: { updatedAt: new Date() },
        });

        return res.status(200).json({
            message: "Submission updated successfully",
            submission: updated,
            new_attachments: uploadedAttachments,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// PATCH /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/grade
// Body: { grade, feedback? }  — TEACHER only (stub, to be implemented later)
export const gradeSubmission = async (req, res) => {
    return res.status(501).json({ message: "Grading not yet implemented" });
};

// GET /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId
// Teacher only — returns full submission with signed attachment URLs
export const getSubmissionDetails = async (req, res) => {
    try {
        const { courseId, assessmentId, submissionId } = req.params;

        await verifyCourseOwner(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        const submission = await prisma.submissions.findUnique({
            where: { id: submissionId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                attachments: true,
            },
        });

        if (!submission || submission.assessment_id !== assessmentId)
            return res.status(404).json({ message: "Submission not found" });

        const attachmentsWithUrls = await Promise.all(
            submission.attachments.map(async (a) => ({
                ...a,
                signed_url: await generateSignedUrl("submission-files", a.bucket_path),
            }))
        );

        return res.status(200).json({
            message: "Submission details retrieved successfully",
            submission: { ...submission, attachments: attachmentsWithUrls },
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// DELETE /api/courses/:courseId/assessments/:assessmentId/source-materials/:materialId
// Teacher only — removes file from Supabase Storage and its DB record
export const deleteSourceMaterial = async (req, res) => {
    try {
        const { courseId, assessmentId, materialId } = req.params;

        await verifyCourseOwner(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        const material = await prisma.source_materials.findUnique({
            where: { id: materialId },
        });

        if (!material || material.assessment_id !== assessmentId)
            return res.status(404).json({ message: "Source material not found" });

        // Remove from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from("source-materials")
            .remove([material.bucket_path]);

        if (storageError)
            throw { status: 500, message: `Storage deletion failed: ${storageError.message}` };

        // Remove DB record
        await prisma.source_materials.delete({ where: { id: materialId } });

        return res.status(200).json({ message: "Source material deleted successfully" });
    } catch (error) {
        return handleError(res, error);
    }
};
