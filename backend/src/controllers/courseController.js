import prisma from "../config/prismaClient.js";
import { generateCourseCode, handleError } from "../utils/courseHelpers.js";

// ─── Teacher Controllers ─────────────────────────────────────────────────────

// POST /api/courses
export const createCourse = async (req, res) => {
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
export const getTeacherCourses = async (req, res) => {
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

// ─── Student Controllers ─────────────────────────────────────────────────────

// POST /api/courses/enroll
// Body: { code }
export const enrollInCourse = async (req, res) => {
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
export const getEnrolledCourses = async (req, res) => {
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
