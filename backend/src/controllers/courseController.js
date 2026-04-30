import prisma from "../config/prismaClient.js";
import { generateCourseCode, handleError, verifyCourseOwner, signUserAvatar, calculateClassStats } from "../utils/courseHelpers.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calculateBlueprintTotal = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return 0;
    return nodes.reduce((sum, node) => {
        if (node.subparts && node.subparts.length > 0) {
            return sum + calculateBlueprintTotal(node.subparts);
        }
        return sum + (Number(node.points || node.total_marks) || 0);
    }, 0);
};

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
                announcements: {
                    include: {
                        assessments: true,
                    },
                },
            },
        });

        const coursesWithAvatars = await Promise.all(
            courses.map(async (course) => ({
                ...course,
                students: await Promise.all(
                    (course.students || []).map(async (e) => ({
                        ...e,
                        student: await signUserAvatar(e.student),
                    }))
                ),
            }))
        );

        return res.status(200).json({ message: "Courses retrieved successfully", courses: coursesWithAvatars });
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
                    include: {
                        teacher: true,
                        students: {
                            include: { student: true },
                        },
                        announcements: {
                            include: {
                                assessments: {
                                    where: { visible_to_students: true },
                                    include: {
                                        submissions: {
                                            where: { user_id: req.user.id },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const enrollmentsWithAvatars = await Promise.all(
            enrollments.map(async (e) => ({
                ...e,
                course: {
                    ...e.course,
                    students: await Promise.all(
                        (e.course.students || []).map(async (s) => ({
                            ...s,
                            student: await signUserAvatar(s.student),
                        }))
                    ),
                    teacher: await signUserAvatar(e.course.teacher),
                },
            }))
        );

        const courses = enrollmentsWithAvatars.map((e) => e.course);
        return res.status(200).json({ message: "Enrolled courses retrieved successfully", courses });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * GET /api/courses/student/marks
 * Returns all marks for the student across all enrolled courses, including class statistics.
 */
export const getStudentMarks = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Get all enrollments with courses and assessments
        const enrollments = await prisma.enrollments.findMany({
            where: { student_id: studentId },
            include: {
                course: {
                    include: {
                        announcements: {
                            include: {
                                assessments: {
                                    where: { visible_to_students: true },
                                    include: {
                                        grading_blueprint: true,
                                        submissions: {
                                            where: { user_id: studentId },
                                            include: { evaluation: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const marksData = await Promise.all(enrollments.map(async (e) => {
            const course = e.course;
            const assessments = course.announcements.flatMap(a => a.assessments);
            
            const results = (await Promise.all(assessments.map(async (asmt) => {
                const studentSubmission = asmt.submissions[0];
                if (studentSubmission?.status !== 'GRADED') return null;
                
                const obtainedMarks = Number(studentSubmission?.evaluation?.total_score ?? studentSubmission?.grade ?? 0);
                
                // Robust total marks calculation
                let totalMarks = Number(asmt.grading_blueprint?.total_marks || asmt.total_marks || 0);
                if (totalMarks === 0 && asmt.grading_blueprint?.structure) {
                    totalMarks = calculateBlueprintTotal(asmt.grading_blueprint.structure);
                }
                
                // Get all graded submissions for stats
                const allSubmissions = await prisma.submissions.findMany({
                    where: { 
                        assessment_id: asmt.id,
                        status: 'GRADED',
                        user: {
                            enrolledCourses: {
                                some: { course_id: course.id }
                            }
                        }
                    },
                    include: { evaluation: true }
                });

                const gradedScores = allSubmissions
                    .map(s => {
                        const val = s.evaluation?.total_score ?? s.grade;
                        return (val !== null && val !== undefined) ? Number(val) : null;
                    });

                const stats = calculateClassStats(gradedScores);

                return {
                    id: asmt.id,
                    title: asmt.title,
                    type: asmt.type,
                    totalMarks,
                    obtainedMarks,
                    status: 'GRADED',
                    stats
                };
            }))).filter(Boolean);

            const grandObtained = results.reduce((acc, r) => acc + Number(r.obtainedMarks), 0);
            const grandTotal = results.reduce((acc, r) => acc + Number(r.totalMarks), 0);

            return {
                courseId: course.id,
                courseTitle: course.title,
                courseCode: course.code,
                results,
                grandObtained: parseFloat(grandObtained.toFixed(2)),
                grandTotal: parseFloat(grandTotal.toFixed(2)),
                gradedCount: results.length
            };
        }));

        return res.status(200).json({ 
            message: "Student marks retrieved", 
            marks: marksData 
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// DELETE /api/courses/enroll/:courseId — STUDENT only
export const unenrollFromCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const enrollment = await prisma.enrollments.findUnique({
            where: {
                course_id_student_id: {
                    course_id: courseId,
                    student_id: req.user.id,
                },
            },
        });

        if (!enrollment) {
            return res.status(404).json({ message: "You are not enrolled in this course." });
        }

        await prisma.enrollments.delete({
            where: { id: enrollment.id },
        });

        res.status(200).json({ message: "Unenrolled successfully" });
    } catch (error) {
        return handleError(res, error);
    }
};

// DELETE /api/courses/:id — TEACHER only
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        await verifyCourseOwner(id, req.user.id);

        await prisma.courses.delete({
            where: { id },
        });

        res.status(200).json({ message: "Course deleted successfully" });
    } catch (error) {
        return handleError(res, error);
    }
};
