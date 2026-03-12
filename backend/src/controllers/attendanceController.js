import prisma from "../config/prismaClient.js";
import { handleError, verifyCourseOwner, verifyStudentEnrolled } from "../utils/courseHelpers.js";

// POST /api/courses/:courseId/attendance
// Body: { date: "YYYY-MM-DD", records: [{ student_id, status }] }
export const markAttendance = async (req, res) => {
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
export const getCourseAttendance = async (req, res) => {
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

// GET /api/courses/:courseId/my-attendance
export const getStudentAttendance = async (req, res) => {
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
