import prisma from "../config/prismaClient.js";
import { v4 as uuidv4 } from "uuid";
import {
    handleError,
    verifyCourseOwner,
    verifyStudentEnrolled,
    verifyAssessmentInCourse,
    signUserAvatar,
} from "../utils/courseHelpers.js";

const CODE_GRADER_URL = process.env.CODE_GRADER_URL || "http://localhost:5004";

// ─── Teacher: Save/Update test cases ─────────────────────────────────────────
// POST /api/courses/:courseId/assessments/:assessmentId/test-cases
export const saveTestCases = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;
        const { language, test_cases, total_marks } = req.body;

        if (!language || !["python", "javascript"].includes(language)) {
            return res.status(400).json({ message: "language must be 'python' or 'javascript'" });
        }
        if (!Array.isArray(test_cases) || test_cases.length === 0) {
            return res.status(400).json({ message: "test_cases must be a non-empty array" });
        }

        await verifyCourseOwner(courseId, req.user.id);
        const assessment = await verifyAssessmentInCourse(assessmentId, courseId);

        if (assessment.type !== "CODING") {
            return res.status(400).json({ message: "This assessment is not of type CODING" });
        }

        // Ensure each test case has an id
        const normalised = test_cases.map((tc) => ({
            id: tc.id || uuidv4(),
            input: tc.input ?? "",
            expected_output: tc.expected_output ?? "",
            is_hidden: Boolean(tc.is_hidden),
        }));

        const codingRecord = await prisma.coding_assessments.upsert({
            where: { assessment_id: assessmentId },
            create: {
                assessment_id: assessmentId,
                language,
                test_cases: normalised,
                total_marks: total_marks ? parseFloat(total_marks) : 10,
            },
            update: {
                language,
                test_cases: normalised,
                ...(total_marks !== undefined ? { total_marks: parseFloat(total_marks) } : {}),
            },
        });

        return res.status(200).json({
            message: "Test cases saved successfully",
            coding_assessment: codingRecord,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// ─── Teacher: Get test cases ──────────────────────────────────────────────────
// GET /api/courses/:courseId/assessments/:assessmentId/test-cases
export const getTestCases = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;
        await verifyCourseOwner(courseId, req.user.id);

        const codingRecord = await prisma.coding_assessments.findUnique({
            where: { assessment_id: assessmentId },
        });

        if (!codingRecord) {
            return res.status(404).json({ message: "No test cases found for this assessment" });
        }

        return res.status(200).json({ coding_assessment: codingRecord });
    } catch (error) {
        return handleError(res, error);
    }
};

// ─── Teacher: Generate test cases via AI ─────────────────────────────────────
// POST /api/courses/:courseId/assessments/:assessmentId/generate-test-cases
export const generateTestCasesAI = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { question, language, count } = req.body;

        if (!question) return res.status(400).json({ message: "question is required" });

        // Only verify course ownership — assessment may not exist yet (teacher
        // can generate test cases before creating the assessment).
        await verifyCourseOwner(courseId, req.user.id);

        const response = await fetch(`${CODE_GRADER_URL}/generate-test-cases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, language: language || "python", count: count || 5 }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return res.status(502).json({ message: err.error || "Code grader service error" });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return handleError(res, error);
    }
};

// ─── Student: Submit code + run tests ────────────────────────────────────────
// POST /api/courses/:courseId/assessments/:assessmentId/code-submit
export const codeSubmit = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;
        const { source_code, language } = req.body;

        if (!source_code) return res.status(400).json({ message: "source_code is required" });
        if (!language || !["python", "javascript"].includes(language)) {
            return res.status(400).json({ message: "language must be 'python' or 'javascript'" });
        }

        await verifyStudentEnrolled(courseId, req.user.id);
        const assessment = await verifyAssessmentInCourse(assessmentId, courseId);

        if (assessment.type !== "CODING") {
            return res.status(400).json({ message: "This assessment is not of type CODING" });
        }
        if (assessment.visible_to_students === false) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        // Get test cases
        const codingRecord = await prisma.coding_assessments.findUnique({
            where: { assessment_id: assessmentId },
        });
        if (!codingRecord) {
            return res.status(400).json({ message: "No test cases configured for this assessment" });
        }

        // Call code-grader service
        const graderResponse = await fetch(`${CODE_GRADER_URL}/run-tests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_code,
                language,
                test_cases: codingRecord.test_cases,
                total_marks: codingRecord.total_marks,
            }),
        });

        if (!graderResponse.ok) {
            const err = await graderResponse.json().catch(() => ({}));
            return res.status(502).json({ message: err.error || "Code grader service unavailable" });
        }

        const graderData = await graderResponse.json();
        const { results, passed_tests, total_tests, grade } = graderData;

        // Determine submission status (SUBMITTED / LATE)
        const now = new Date();
        const isLate = assessment.due_date && now > assessment.due_date;
        const status = isLate ? "LATE" : "SUBMITTED";

        // Upsert submission record
        let submission = await prisma.submissions.findUnique({
            where: {
                user_id_assessment_id: {
                    user_id: req.user.id,
                    assessment_id: assessmentId,
                },
            },
        });

        if (!submission) {
            submission = await prisma.submissions.create({
                data: {
                    user_id: req.user.id,
                    assessment_id: assessmentId,
                    status,
                    submitted_at: now,
                    grade,
                },
            });
        } else {
            submission = await prisma.submissions.update({
                where: { id: submission.id },
                data: {
                    grade,
                    status: submission.status === "GRADED" ? "GRADED" : status,
                    updatedAt: now,
                },
            });
        }

        // Upsert code_submission record
        const codeSubmission = await prisma.code_submissions.upsert({
            where: { submission_id: submission.id },
            create: {
                submission_id: submission.id,
                language,
                source_code,
                test_results: results,
                passed_tests,
                total_tests,
            },
            update: {
                language,
                source_code,
                test_results: results,
                passed_tests,
                total_tests,
            },
        });

        return res.status(200).json({
            message: "Code submitted and tests executed",
            submission,
            code_submission: codeSubmission,
            passed_tests,
            total_tests,
            grade,
            results,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// ─── Student: Get own code submission ────────────────────────────────────────
// GET /api/courses/:courseId/assessments/:assessmentId/code-submission
export const getCodeSubmission = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        await verifyStudentEnrolled(courseId, req.user.id);
        const assessment = await verifyAssessmentInCourse(assessmentId, courseId);

        if (assessment.visible_to_students === false) {
            return res.status(404).json({ message: "Assessment not found" });
        }

        const submission = await prisma.submissions.findUnique({
            where: {
                user_id_assessment_id: {
                    user_id: req.user.id,
                    assessment_id: assessmentId,
                },
            },
            include: { code_submission: true },
        });

        if (!submission || !submission.code_submission) {
            return res.status(200).json({ submission: null, code_submission: null });
        }

        // Mask expected_output for hidden test cases in results
        const maskedResults = (submission.code_submission.test_results || []).map((r) => ({
            ...r,
            expected_output: r.is_hidden ? null : r.expected_output,
        }));

        return res.status(200).json({
            submission,
            code_submission: {
                ...submission.code_submission,
                test_results: maskedResults,
            },
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// ─── Teacher: Get all code submissions for an assessment ──────────────────────
// GET /api/courses/:courseId/assessments/:assessmentId/code-submissions
export const getAllCodeSubmissions = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        await verifyCourseOwner(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        const submissions = await prisma.submissions.findMany({
            where: { assessment_id: assessmentId },
            include: {
                user: { select: { id: true, name: true, email: true, profile_picture: true } },
                code_submission: true,
            },
            orderBy: { submitted_at: "desc" },
        });

        // Sign avatars
        const withAvatars = await Promise.all(
            submissions.map(async (s) => ({
                ...s,
                user: await signUserAvatar(s.user),
            }))
        );

        return res.status(200).json({ submissions: withAvatars });
    } catch (error) {
        return handleError(res, error);
    }
};
