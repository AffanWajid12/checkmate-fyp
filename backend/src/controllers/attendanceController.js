import prisma from "../config/prismaClient.js";
import { handleError, verifyCourseOwner, verifyStudentEnrolled, signUserAvatar } from "../utils/courseHelpers.js";

// POST /api/courses/:courseId/attendance
// Body: { sessionId?, date, title?, records: [{ student_id, status }] }
export const markAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { sessionId, date, title, records } = req.body;

        if (!Array.isArray(records) || records.length === 0)
            return res.status(400).json({ message: "records[] is required" });

        await verifyCourseOwner(courseId, req.user.id);

        let finalSessionId = sessionId;

        if (!finalSessionId) {
            if (!date) return res.status(400).json({ message: "date is required for new session" });
            const session = await prisma.attendance_sessions.create({
                data: {
                    course_id: courseId,
                    date: new Date(date),
                    title: title || null,
                },
            });
            finalSessionId = session.id;
        } else if (title) {
            // Update title if provided for existing session
            await prisma.attendance_sessions.update({
                where: { id: finalSessionId },
                data: { title },
            });
        }

        const results = await Promise.all(
            records.map(async ({ student_id, status }) => {
                const enrollment = await prisma.enrollments.findUnique({
                    where: {
                        course_id_student_id: { course_id: courseId, student_id },
                    },
                });

                if (!enrollment) return { student_id, error: "Not enrolled" };

                return prisma.attendance.upsert({
                    where: {
                        enrollment_id_session_id: {
                            enrollment_id: enrollment.id,
                            session_id: finalSessionId,
                        },
                    },
                    update: { status },
                    create: {
                        enrollment_id: enrollment.id,
                        session_id: finalSessionId,
                        status,
                    },
                });
            })
        );

        return res.status(200).json({ 
            message: "Attendance marked successfully", 
            sessionId: finalSessionId,
            results 
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/courses/:courseId/attendance
export const getCourseAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        await verifyCourseOwner(courseId, req.user.id);

        const sessions = await prisma.attendance_sessions.findMany({
            where: { course_id: courseId },
            include: {
                records: {
                    include: {
                        enrollment: {
                            include: { student: true },
                        },
                    },
                },
            },
            orderBy: { date: "desc" },
        });

        const sessionsWithAvatars = await Promise.all(
            sessions.map(async (session) => ({
                ...session,
                records: await Promise.all(
                    (session.records || []).map(async (record) => ({
                        ...record,
                        enrollment: {
                            ...record.enrollment,
                            student: await signUserAvatar(record.enrollment.student),
                        },
                    }))
                ),
            }))
        );

        return res.status(200).json({ message: "Attendance retrieved successfully", sessions: sessionsWithAvatars });
    } catch (error) {
        return handleError(res, error);
    }
};

// DELETE /api/courses/:courseId/attendance/:sessionId
export const deleteAttendanceSession = async (req, res) => {
    try {
        const { courseId, sessionId } = req.params;
        await verifyCourseOwner(courseId, req.user.id);

        const session = await prisma.attendance_sessions.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.course_id !== courseId) {
            return res.status(404).json({ message: "Attendance session not found" });
        }

        // Deleting the session will cascade delete all its attendance records due to the schema relation
        await prisma.attendance_sessions.delete({
            where: { id: sessionId },
        });

        return res.status(200).json({ message: "Attendance session deleted successfully" });
    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/courses/:courseId/my-attendance
export const getStudentAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const enrollment = await verifyStudentEnrolled(courseId, req.user.id);

        const records = await prisma.attendance.findMany({
            where: { enrollment_id: enrollment.id },
            include: {
                session: true,
            },
            orderBy: { session: { date: "desc" } },
        });

        // Map to a friendlier format if needed, but for now just include session
        return res.status(200).json({ message: "Attendance retrieved successfully", records });
    } catch (error) {
        return handleError(res, error);
    }
};
