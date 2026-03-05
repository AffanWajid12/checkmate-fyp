import prisma from "../config/prismaClient.js";
import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";

// ─── Helpers ────────────────────────────────────────────────────────────────

// Generates a random uppercase alphanumeric code, e.g. "A3BX9Z"
const generateCourseCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

// Throws with status + message if the teacher does not own the course
const verifyCourseOwner = async (courseId, teacherId) => {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw { status: 404, message: "Course not found" };
    if (course.teacher_id !== teacherId) throw { status: 403, message: "Forbidden" };
    return course;
};

// Throws with status + message if the student is not enrolled in the course
const verifyStudentEnrolled = async (courseId, studentId) => {
    const enrollment = await prisma.enrollments.findUnique({
        where: { course_id_student_id: { course_id: courseId, student_id: studentId } },
    });
    if (!enrollment) throw { status: 403, message: "Not enrolled in this course" };
    return enrollment;
};

// Centralised error handler — reads { status, message } thrown by helpers
const handleError = (res, error) => {
    if (error.status) {
        return res.status(error.status).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: error.message });
};

// Returns a 1-hour signed URL for a private Supabase Storage object
const generateSignedUrl = async (bucket, path) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
    if (error) throw { status: 500, message: `Failed to generate signed URL: ${error.message}` };
    return data.signedUrl;
};

// Verifies an assessment exists and belongs to a course (via its announcement)
const verifyAssessmentInCourse = async (assessmentId, courseId) => {
    const assessment = await prisma.assessments.findUnique({
        where: { id: assessmentId },
        include: { announcement: true },
    });
    if (!assessment) throw { status: 404, message: "Assessment not found" };
    if (assessment.announcement.course_id !== courseId)
        throw { status: 403, message: "Assessment does not belong to this course" };
    return assessment;
};

// ─── Teacher Controllers ─────────────────────────────────────────────────────

// POST /api/courses
const createCourse = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ message: "Title is required" });

        // Generate a unique code — retry on the rare collision
        let code;
        let exists = true;
        while (exists) {
            code = generateCourseCode();
            exists = await prisma.courses.findUnique({ where: { code } });
        }

        const course = await prisma.courses.create({
            data: {
                title,
                description,
                code,
                teacher_id: req.user.id,
            },
        });

        return res.status(201).json({ message: "Course created successfully", course });
    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/courses/my-courses
const getTeacherCourses = async (req, res) => {
    try {
        const courses = await prisma.courses.findMany({
            where: { teacher_id: req.user.id },
            include: {
                students: {
                    include: { student: true },
                },
                announcements: true,
            },
        });

        return res.status(200).json({ message: "Courses retrieved successfully", courses });
    } catch (error) {
        return handleError(res, error);
    }
};

// POST /api/courses/:courseId/announcements
const addAnnouncement = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description } = req.body;

        if (!title || !description)
            return res.status(400).json({ message: "Title and description are required" });

        await verifyCourseOwner(courseId, req.user.id);

        const announcement = await prisma.announcements.create({
            data: {
                title,
                description,
                course_id: courseId,
            },
        });

        return res.status(201).json({ message: "Announcement created successfully", announcement });
    } catch (error) {
        return handleError(res, error);
    }
};

// POST /api/courses/:courseId/attendance
// Body: { date: "YYYY-MM-DD", records: [{ student_id, status }] }
const markAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { date, records } = req.body;

        if (!date || !Array.isArray(records) || records.length === 0)
            return res.status(400).json({ message: "date and records[] are required" });

        await verifyCourseOwner(courseId, req.user.id);

        const attendanceDate = new Date(date);

        const results = await Promise.all(
            records.map(async ({ student_id, status }) => {
                // Resolve the enrollment for this student in this course
                const enrollment = await prisma.enrollments.findUnique({
                    where: {
                        course_id_student_id: { course_id: courseId, student_id },
                    },
                });

                if (!enrollment) return { student_id, error: "Not enrolled in course" };

                const record = await prisma.attendance.upsert({
                    where: {
                        enrollment_id_date: {
                            enrollment_id: enrollment.id,
                            date: attendanceDate,
                        },
                    },
                    update: { status },
                    create: {
                        enrollment_id: enrollment.id,
                        date: attendanceDate,
                        status,
                    },
                });

                return record;
            })
        );

        return res.status(200).json({ message: "Attendance marked successfully", results });
    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/courses/:courseId/attendance
const getCourseAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;

        await verifyCourseOwner(courseId, req.user.id);

        const records = await prisma.attendance.findMany({
            where: {
                enrollment: { course_id: courseId },
            },
            include: {
                enrollment: {
                    include: { student: true },
                },
            },
            orderBy: { date: "asc" },
        });

        return res.status(200).json({ message: "Attendance retrieved successfully", records });
    } catch (error) {
        return handleError(res, error);
    }
};

// ─── Student Controllers ─────────────────────────────────────────────────────

// POST /api/courses/enroll
// Body: { code }
const enrollInCourse = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Course code is required" });

        // 1. Find the course by code
        const course = await prisma.courses.findUnique({ where: { code } });
        if (!course) return res.status(404).json({ message: "Course not found" });

        // 2. Check for duplicate enrollment
        const existing = await prisma.enrollments.findUnique({
            where: {
                course_id_student_id: { course_id: course.id, student_id: req.user.id },
            },
        });
        if (existing) return res.status(409).json({ message: "Already enrolled in this course" });

        // 3. Create enrollment
        const enrollment = await prisma.enrollments.create({
            data: {
                course_id: course.id,
                student_id: req.user.id,
            },
            include: { course: true },
        });

        return res.status(201).json({ message: "Enrolled successfully", enrollment });
    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/courses/enrolled
const getEnrolledCourses = async (req, res) => {
    try {
        const enrollments = await prisma.enrollments.findMany({
            where: { student_id: req.user.id },
            include: {
                course: {
                    include: { teacher: true },
                },
            },
        });

        const courses = enrollments.map((e) => e.course);
        return res.status(200).json({ message: "Enrolled courses retrieved successfully", courses });
    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/courses/:courseId/my-attendance
const getStudentAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;

        // 1. Verify the student is enrolled
        const enrollment = await verifyStudentEnrolled(courseId, req.user.id);

        // 2. Fetch all attendance records for this enrollment
        const records = await prisma.attendance.findMany({
            where: { enrollment_id: enrollment.id },
            orderBy: { date: "asc" },
        });

        return res.status(200).json({ message: "Attendance retrieved successfully", records });
    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/courses/:courseId/announcements  (shared — teacher + student)
const getCourseAnnouncements = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Allow access if teacher owns the course OR student is enrolled
        if (req.user.role === "TEACHER") {
            await verifyCourseOwner(courseId, req.user.id);
        } else {
            await verifyStudentEnrolled(courseId, req.user.id);
        }        const announcements = await prisma.announcements.findMany({
            where: { course_id: courseId },
            include: {
                assessments: {
                    include: { source_materials: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({ message: "Announcements retrieved successfully", announcements });
    } catch (error) {
        return handleError(res, error);
    }
};

// ─── Assessment Controllers ──────────────────────────────────────────────────

// POST /api/courses/:courseId/announcements/:announcementId/assessments
// Body (multipart/form-data): title, type, instructions?, due_date?, files[]
const addAssessment = async (req, res) => {
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
const getAssessmentDetails = async (req, res) => {
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
const submitAssessment = async (req, res) => {
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
const updateSubmission = async (req, res) => {
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
const gradeSubmission = async (req, res) => {
    return res.status(501).json({ message: "Grading not yet implemented" });
};

// GET /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId
// Teacher only — returns full submission with signed attachment URLs
const getSubmissionDetails = async (req, res) => {
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
const deleteSourceMaterial = async (req, res) => {
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

export {
    createCourse,
    getTeacherCourses,
    addAnnouncement,
    markAttendance,
    getCourseAttendance,
    enrollInCourse,
    getEnrolledCourses,
    getStudentAttendance,
    getCourseAnnouncements,
    addAssessment,
    getAssessmentDetails,
    submitAssessment,
    updateSubmission,
    gradeSubmission,
    getSubmissionDetails,
    deleteSourceMaterial,
};
