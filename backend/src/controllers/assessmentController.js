import prisma from "../config/prismaClient.js";
import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
import {
    handleError,
    verifyCourseOwner,
    verifyStudentEnrolled,
    verifyAssessmentInCourse,
    generateSignedUrl,
    signUserAvatar,
} from "../utils/courseHelpers.js";
import { buildAssessmentAnnouncement } from "../utils/assessmentAnnouncementTemplates.js";

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

// POST /api/courses/:courseId/assessments
// Creates an announcement automatically, then creates the assessment linked to it.
// Body (multipart/form-data): title, type, instructions?, due_date?, files[]
export const createAssessment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, type, instructions, due_date } = req.body;

        if (!title || !type)
            return res.status(400).json({ message: "title and type are required" });

        await verifyCourseOwner(courseId, req.user.id);

        const dueDate = due_date ? new Date(due_date) : null;
        if (due_date && Number.isNaN(dueDate.getTime())) {
            return res.status(400).json({ message: "due_date must be a valid ISO date" });
        }

        const announcementPayload = buildAssessmentAnnouncement({
            type,
            assessmentTitle: title,
            dueDate,
            instructions,
        });

        // Create announcement + assessment (DB-only) atomically
        const { announcement, assessment } = await prisma.$transaction(async (tx) => {
            const announcement = await tx.announcements.create({
                data: {
                    title: announcementPayload.title,
                    description: announcementPayload.description,
                    course_id: courseId,
                },
            });

            const assessment = await tx.assessments.create({
                data: {
                    title,
                    type,
                    instructions: instructions ?? null,
                    due_date: dueDate,
                    announcement_id: announcement.id,
                },
            });

            return { announcement, assessment };
        });

        // Upload any source material files to Supabase Storage.
        // Per requirement: do NOT roll back assessment/announcement if upload fails.
        const uploadedMaterials = [];
        const uploadErrors = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const ext = file.originalname.split(".").pop();
                    const storagePath = `${courseId}/${assessment.id}/${uuidv4()}.${ext}`;

                    const { error: uploadError } = await supabase.storage
                        .from("source-materials")
                        .upload(storagePath, file.buffer, {
                            contentType: file.mimetype,
                            upsert: false,
                        });

                    if (uploadError) {
                        uploadErrors.push({ file_name: file.originalname, message: uploadError.message });
                        continue;
                    }

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
                } catch (e) {
                    uploadErrors.push({ file_name: file?.originalname, message: e?.message ?? "Upload failed" });
                }
            }
        }

        if (uploadErrors.length) {
            return res.status(201).json({
                message: "Assessment created successfully (some files failed to upload)",
                announcement,
                assessment,
                source_materials: uploadedMaterials,
                upload_errors: uploadErrors,
            });
        }

        return res.status(201).json({
            message: "Assessment created successfully",
            announcement,
            assessment,
            source_materials: uploadedMaterials,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// POST /api/courses/:courseId/assessments/:assessmentId/source-materials
// Body (multipart/form-data): files[]
export const addAssessmentSourceMaterials = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        await verifyCourseOwner(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "At least one file is required" });

        const uploadedMaterials = [];
        const uploadErrors = [];

        for (const file of req.files) {
            try {
                const ext = file.originalname.split(".").pop();
                const storagePath = `${courseId}/${assessmentId}/${uuidv4()}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from("source-materials")
                    .upload(storagePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false,
                    });

                if (uploadError) {
                    uploadErrors.push({ file_name: file.originalname, message: uploadError.message });
                    continue;
                }

                const material = await prisma.source_materials.create({
                    data: {
                        bucket_path: storagePath,
                        file_name: file.originalname,
                        file_size: file.size,
                        mime_type: file.mimetype,
                        assessment_id: assessmentId,
                    },
                });

                uploadedMaterials.push(material);
            } catch (e) {
                uploadErrors.push({ file_name: file?.originalname, message: e?.message ?? "Upload failed" });
            }
        }

        return res.status(201).json({
            message: uploadErrors.length
                ? "Source materials uploaded (some files failed)"
                : "Source materials uploaded successfully",
            source_materials: uploadedMaterials,
            upload_errors: uploadErrors,
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
                include: { student: { select: { id: true, name: true, email: true, profile_picture: true } } },
            });

            // Get all submissions for this assessment
            const submissions = await prisma.submissions.findMany({
                where: { assessment_id: assessmentId },
                include: {
                    user: { select: { id: true, name: true, email: true, profile_picture: true } },
                },
            });

            const submittedIds = new Set(submissions.map((s) => s.user_id));

            // Sign all avatars
            const submittedWithAvatars = await Promise.all(
                submissions
                    .filter((s) => s.status === "SUBMITTED" || s.status === "GRADED")
                    .map(async (s) => ({ ...s, user: await signUserAvatar(s.user) }))
            );
            const lateWithAvatars = await Promise.all(
                submissions
                    .filter((s) => s.status === "LATE")
                    .map(async (s) => ({ ...s, user: await signUserAvatar(s.user) }))
            );
            const notSubmittedWithAvatars = await Promise.all(
                enrollments
                    .filter((e) => !submittedIds.has(e.student_id))
                    .map(async (e) => await signUserAvatar(e.student))
            );

            return res.status(200).json({
                message: "Assessment details retrieved successfully",
                assessment: { ...assessment, source_materials: materialsWithUrls },
                submitted: submittedWithAvatars,
                late: lateWithAvatars,
                not_submitted: notSubmittedWithAvatars,
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

// POST /api/courses/:courseId/assessments/:assessmentId/submissions
// Teacher creates a submission for a student (scanned pipeline)
// Body (multipart/form-data): student_id, files[]
export const teacherCreateSubmission = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;
        const { student_id } = req.body;

        if (!student_id)
            return res.status(400).json({ message: "student_id is required" });

        await verifyCourseOwner(courseId, req.user.id);
        const assessment = await verifyAssessmentInCourse(assessmentId, courseId);

        // Teacher can only create submissions for students enrolled in this course
        await verifyStudentEnrolled(courseId, student_id);

        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "At least one file is required" });

        // Check for duplicate submission for that student
        const existing = await prisma.submissions.findUnique({
            where: {
                user_id_assessment_id: {
                    user_id: student_id,
                    assessment_id: assessmentId,
                },
            },
        });
        if (existing)
            return res.status(409).json({ message: "Student already has a submission. Use teacher add-files endpoint (not yet implemented)." });

        // Determine SUBMITTED vs LATE based on assessment due_date
        const now = new Date();
        const isLate = assessment.due_date && now > assessment.due_date;
        const status = isLate ? "LATE" : "SUBMITTED";

        const submission = await prisma.submissions.create({
            data: {
                user_id: student_id,
                assessment_id: assessmentId,
                status,
                submitted_at: now,
            },
        });

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
            message: `Submission created successfully${isLate ? " (late)" : ""}`,
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

// PATCH /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId
// Teacher appends more files to an existing submission (scanned pipeline)
export const teacherAppendSubmissionFiles = async (req, res) => {
    try {
        const { courseId, assessmentId, submissionId } = req.params;

        await verifyCourseOwner(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "At least one file is required" });

        const submission = await prisma.submissions.findUnique({
            where: { id: submissionId },
        });

        if (!submission || submission.assessment_id !== assessmentId)
            return res.status(404).json({ message: "Submission not found" });

        if (submission.status === "GRADED")
            return res.status(403).json({ message: "Submission has been graded and cannot be modified." });

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

// DELETE /api/courses/:courseId/assessments/:assessmentId/submit
// Student retracts their submission entirely (like Google Classroom "Unsubmit")
export const unsubmitAssessment = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        await verifyStudentEnrolled(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        const submission = await prisma.submissions.findUnique({
            where: {
                user_id_assessment_id: {
                    user_id: req.user.id,
                    assessment_id: assessmentId,
                },
            },
            include: { attachments: true },
        });

        if (!submission)
            return res.status(404).json({ message: "No submission found to retract." });

        if (submission.status === "GRADED")
            return res.status(403).json({ message: "Submission has been graded and cannot be retracted." });

        // Delete all files from Supabase Storage
        if (submission.attachments.length > 0) {
            const paths = submission.attachments.map((a) => a.bucket_path);
            const { error: storageError } = await supabase.storage
                .from("submission-files")
                .remove(paths);
            if (storageError)
                console.error("Storage deletion failed:", storageError.message);
        }

        // Delete all attachment DB records, then the submission itself
        await prisma.attachments.deleteMany({ where: { submission_id: submission.id } });
        await prisma.submissions.delete({ where: { id: submission.id } });

        return res.status(200).json({ message: "Submission retracted successfully." });
    } catch (error) {
        return handleError(res, error);
    }
};

// DELETE /api/courses/:courseId/assessments/:assessmentId/attachments/:attachmentId
// Student removes a single file from their submission
export const removeAttachment = async (req, res) => {
    try {
        const { courseId, assessmentId, attachmentId } = req.params;

        await verifyStudentEnrolled(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        // Find the attachment and verify it belongs to this student's submission
        const attachment = await prisma.attachments.findUnique({
            where: { id: attachmentId },
            include: { submission: true },
        });

        if (!attachment)
            return res.status(404).json({ message: "Attachment not found." });

        if (attachment.submission.user_id !== req.user.id)
            return res.status(403).json({ message: "You can only remove your own files." });

        if (attachment.submission.assessment_id !== assessmentId)
            return res.status(403).json({ message: "Attachment does not belong to this assessment." });

        if (attachment.submission.status === "GRADED")
            return res.status(403).json({ message: "Submission has been graded and cannot be modified." });

        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from("submission-files")
            .remove([attachment.bucket_path]);
        if (storageError)
            console.error("Storage deletion failed:", storageError.message);

        // Delete DB record
        await prisma.attachments.delete({ where: { id: attachmentId } });

        return res.status(200).json({ message: "File removed successfully." });
    } catch (error) {
        return handleError(res, error);
    }
};

// PATCH /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/grade
// Body: { grade, feedback? }  — TEACHER only
export const gradeSubmission = async (req, res) => {
    try {
        const { courseId, assessmentId, submissionId } = req.params;
        const { grade, feedback } = req.body;

        if (grade === undefined)
            return res.status(400).json({ message: "grade is required" });

        await verifyCourseOwner(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        const submission = await prisma.submissions.findUnique({
            where: { id: submissionId },
        });

        if (!submission || submission.assessment_id !== assessmentId)
            return res.status(404).json({ message: "Submission not found" });

        const updated = await prisma.submissions.update({
            where: { id: submissionId },
            data: {
                grade: parseFloat(grade),
                feedback: feedback ?? null,
                status: "GRADED",
            },
        });

        return res.status(200).json({
            message: "Submission graded successfully",
            submission: updated,
        });
    } catch (error) {
        return handleError(res, error);
    }
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
                user: { select: { id: true, name: true, email: true, profile_picture: true } },
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

        const signedUser = await signUserAvatar(submission.user);

        return res.status(200).json({
            message: "Submission details retrieved successfully",
            submission: { ...submission, user: signedUser, attachments: attachmentsWithUrls },
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

// DELETE /api/courses/:courseId/assessments/:assessmentId
export const deleteAssessment = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        await verifyCourseOwner(courseId, req.user.id);
        const assessment = await verifyAssessmentInCourse(assessmentId, courseId);

        // Fetch with all dependent relations for storage cleanup
        const assessmentWithData = await prisma.assessments.findUnique({
            where: { id: assessmentId },
            include: {
                source_materials: true,
                submissions: {
                    include: { attachments: true }
                }
            }
        });

        const materialPaths = (assessmentWithData.source_materials || []).map(m => m.bucket_path);
        const attachmentPaths = [];
        (assessmentWithData.submissions || []).forEach(s => {
            (s.attachments || []).forEach(att => attachmentPaths.push(att.bucket_path));
        });

        // Cleanup Supabase Storage
        if (materialPaths.length > 0) {
            await supabase.storage.from("source-materials").remove(materialPaths);
        }
        if (attachmentPaths.length > 0) {
            await supabase.storage.from("submission-files").remove(attachmentPaths);
        }

        // Delete from Prisma (CASCADE handles all related DB records)
        await prisma.assessments.delete({
            where: { id: assessmentId }
        });

        return res.status(200).json({ message: "Assessment and related data deleted successfully" });
    } catch (error) {
        return handleError(res, error);
    }
};
// PATCH /api/courses/:courseId/assessments/:assessmentId
export const updateAssessment = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;
        const { title, type, instructions, due_date } = req.body;

        await verifyCourseOwner(courseId, req.user.id);

        const assessment = await prisma.assessments.findUnique({
            where: { id: assessmentId },
        });

        if (!assessment || assessment.announcement?.course_id !== courseId) {
            // Re-verify relationship as redundant check
            const exists = await prisma.assessments.findFirst({
                where: { id: assessmentId, announcement: { course_id: courseId } }
            });
            if (!exists) return res.status(404).json({ message: "Assessment not found" });
        }

        const dueDate = due_date ? new Date(due_date) : undefined;
        if (due_date && Number.isNaN(dueDate.getTime())) {
            return res.status(400).json({ message: "due_date must be a valid ISO date" });
        }

        const updated = await prisma.assessments.update({
            where: { id: assessmentId },
            data: {
                title: title ?? assessment.title,
                type: type ?? assessment.type,
                instructions: instructions ?? assessment.instructions,
                due_date: due_date !== undefined ? dueDate : assessment.due_date,
            },
            include: {
                source_materials: true,
            },
        });

        return res.status(200).json({ message: "Assessment updated successfully", assessment: updated });
    } catch (error) {
        return handleError(res, error);
    }
};
