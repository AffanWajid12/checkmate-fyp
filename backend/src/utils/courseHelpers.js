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
    // Log the full error for debugging
    console.error("--- ERROR LOG START ---");
    console.error("Status Code (if any):", error.status);
    console.error("Message:", error.message);
    if (error.stack) console.error("Stack Trace:", error.stack);
    console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error("--- ERROR LOG END ---");

    if (error.status) {
        return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ 
        message: "Internal Server Error", 
        error: error.message,
        // Don't leak stack trace to frontend in production, but helpful for debugging now
        details: error.stack 
    });
};

// Returns a 1-hour signed URL for a private Supabase Storage object
// Now resilient: logs errors and returns null instead of throwing, to prevent crashing the API
export const generateSignedUrl = async (bucket, path) => {
    if (!path) return null;
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);
        if (error) {
            console.error(`Supabase error signing ${path} in bucket ${bucket}:`, error.message);
            return null;
        }
        return data.signedUrl;
    } catch (err) {
        console.error(`System error signing ${path} in bucket ${bucket}:`, err.message);
        return null;
    }
};

// Replaces profile_picture path with a signed URL in a user object
export const signUserAvatar = async (user) => {
    if (!user || !user.profile_picture) return user;
    try {
        const signedUrl = await generateSignedUrl("profiles", user.profile_picture);
        return { ...user, profile_picture: signedUrl };
    } catch (error) {
        console.error("Avatar signing failed:", error);
        return user;
    }
};

// Verifies an assessment exists and belongs to a course (via its announcement)
export const verifyAssessmentInCourse = async (assessmentId, courseId) => {
    const assessment = await prisma.assessments.findUnique({
        where: { id: assessmentId },
        include: { announcement: true, source_materials: true, grading_blueprint: true },
    });
    if (!assessment) throw { status: 404, message: "Assessment not found" };
    if (assessment.announcement.course_id !== courseId)
        throw { status: 403, message: "Assessment does not belong to this course" };
    return assessment;
};

// Calculates class performance statistics from an array of numeric scores
export const calculateClassStats = (scores) => {
    const gradedScores = scores.filter(s => s !== null && !isNaN(s));
    if (gradedScores.length === 0) {
        return { average: 0, min: 0, max: 0, stdDev: 0, count: 0 };
    }

    const sum = gradedScores.reduce((a, b) => a + Number(b), 0);
    const avg = sum / gradedScores.length;
    const min = Math.min(...gradedScores);
    const max = Math.max(...gradedScores);
    const variance = gradedScores.reduce((a, b) => a + Math.pow(Number(b) - avg, 2), 0) / gradedScores.length;
    const stdDev = Math.sqrt(variance);

    return {
        average: parseFloat(avg.toFixed(2)),
        min: parseFloat(min.toFixed(2)),
        max: parseFloat(max.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        count: gradedScores.length
    };
};
