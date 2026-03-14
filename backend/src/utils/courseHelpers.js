import prisma from "../config/prismaClient.js";
import supabase from "../config/supabaseClient.js";

// Generates a random uppercase alphanumeric code, e.g. "A3BX9Z"
export const generateCourseCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

// Throws with status + message if the teacher does not own the course
export const verifyCourseOwner = async (courseId, teacherId) => {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw { status: 404, message: "Course not found" };
    if (course.teacher_id !== teacherId) throw { status: 403, message: "Forbidden" };
    return course;
};

// Throws with status + message if the student is not enrolled in the course
export const verifyStudentEnrolled = async (courseId, studentId) => {
    const enrollment = await prisma.enrollments.findUnique({
        where: { course_id_student_id: { course_id: courseId, student_id: studentId } },
    });
    if (!enrollment) throw { status: 403, message: "Not enrolled in this course" };
    return enrollment;
};

// Centralised error handler — reads { status, message } thrown by helpers
export const handleError = (res, error) => {
    console.log(error);
    if (error.status) {
        return res.status(error.status).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: error.message });
};

// Returns a 1-hour signed URL for a private Supabase Storage object
export const generateSignedUrl = async (bucket, path) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
    if (error) throw { status: 500, message: `Failed to generate signed URL: ${error.message}` };
    return data.signedUrl;
};

// Verifies an assessment exists and belongs to a course (via its announcement)
export const verifyAssessmentInCourse = async (assessmentId, courseId) => {
    const assessment = await prisma.assessments.findUnique({
        where: { id: assessmentId },
        include: { announcement: true, source_materials: true },
    });
    if (!assessment) throw { status: 404, message: "Assessment not found" };
    if (assessment.announcement.course_id !== courseId)
        throw { status: 403, message: "Assessment does not belong to this course" };
    return assessment;
};
