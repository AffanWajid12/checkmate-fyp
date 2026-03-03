import prisma from "../config/prismaClient.js";

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
        }

        const announcements = await prisma.announcements.findMany({
            where: { course_id: courseId },
            include: { assessments: true },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({ message: "Announcements retrieved successfully", announcements });
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
};
