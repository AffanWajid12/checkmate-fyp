import prisma from "../config/prismaClient.js";
import {
    handleError,
    verifyCourseOwner,
    verifyStudentEnrolled,
    verifyAssessmentInCourse,
} from "../utils/courseHelpers.js";
import { llmGenerate } from "../utils/llmClient.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_WEAK_THRESHOLD = 0.6; // 60 %

/**
 * Parse JSON from an LLM response that may contain markdown fences.
 */
const parseJsonFromLLM = (text) => {
    // Strip markdown code-fence wrapper if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    }
    return JSON.parse(cleaned);
};

/**
 * Extract topics for a list of questions via a single LLM call.
 * Returns a map: label → topic string.
 */
const extractTopics = async (questions) => {
    if (!questions || questions.length === 0) return {};

    const questionList = questions
        .map((q) => `${q.label} (${q.points || q.max_points || 0} pts): ${q.question_text || q.label}`)
        .join("\n");

    const prompt = `Given the following exam questions, extract the main academic topic or concept each question tests.
Return ONLY a valid JSON array with objects containing "label" and "topic" fields.
Example: [{"label": "Q1", "topic": "Newton's Second Law"}]

Questions:
${questionList}`;

    const systemPrompt =
        "You are an expert academic analyst. Return only valid JSON, no explanation.";

    try {
        const raw = await llmGenerate(prompt, systemPrompt);
        const parsed = parseJsonFromLLM(raw);
        const map = {};
        for (const item of parsed) {
            map[item.label] = item.topic;
        }
        return map;
    } catch (err) {
        console.error("[Insights] Topic extraction failed:", err.message);
        // Fallback: use question_text as topic
        const map = {};
        for (const q of questions) {
            map[q.label] = q.question_text || q.label;
        }
        return map;
    }
};

/**
 * Generate a per-student improvement insight via LLM.
 */
const generateStudentInsight = async (studentName, score, total, questionBreakdown, weakTopics) => {
    const qSummary = questionBreakdown
        .map((q) => `${q.label} (${q.topic}): ${q.score}/${q.max_points}`)
        .join(", ");

    const prompt = `A student named ${studentName} scored ${score}/${total} on an assessment.
Question breakdown: ${qSummary}
Topics where they scored below 60%: ${weakTopics.length > 0 ? weakTopics.join(", ") : "None"}

Write a short, encouraging, actionable improvement suggestion (2-3 sentences) for the student. Address them directly.`;

    const systemPrompt =
        "You are a supportive academic advisor. Be specific, encouraging, and actionable.";

    try {
        return await llmGenerate(prompt, systemPrompt);
    } catch (err) {
        console.error("[Insights] Student insight generation failed:", err.message);
        return "Could not generate personalised insight at this time.";
    }
};

/**
 * Generate a teacher class-summary via LLM.
 */
const generateTeacherSummary = async (assessmentTitle, gradedCount, classAvg, total, questionAverages, weakTopics) => {
    const qAvgSummary = questionAverages
        .map((q) => `${q.label} "${q.topic}": avg ${q.avg_score.toFixed(1)}/${q.max_points}`)
        .join("; ");

    const prompt = `Assessment: "${assessmentTitle}"
Class of ${gradedCount} students, average score: ${classAvg.toFixed(1)}/${total}
Per-question averages: ${qAvgSummary}
Topics needing more focus: ${weakTopics.length > 0 ? weakTopics.join(", ") : "None identified"}

Write a 3-4 sentence summary of class performance for the teacher. Highlight strengths and suggest pedagogical improvements.`;

    const systemPrompt =
        "You are an education analytics assistant helping teachers improve their instruction. Be concise and professional.";

    try {
        return await llmGenerate(prompt, systemPrompt);
    } catch (err) {
        console.error("[Insights] Teacher summary generation failed:", err.message);
        return "Could not generate class summary at this time.";
    }
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/courses/:courseId/assessments/:assessmentId/insights/generate
 * TEACHER only — computes analytics and generates LLM insights, then upserts.
 */
export const generateInsights = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        // Read optional threshold from query / body (default 60 %)
        const threshold = parseFloat(req.body.threshold ?? req.query.threshold ?? DEFAULT_WEAK_THRESHOLD);

        await verifyCourseOwner(courseId, req.user.id);
        const assessment = await verifyAssessmentInCourse(assessmentId, courseId);

        // Fetch all GRADED submissions with evaluations and user info
        const gradedSubmissions = await prisma.submissions.findMany({
            where: { assessment_id: assessmentId, status: "GRADED" },
            include: {
                evaluation: true,
                user: { select: { id: true, name: true, email: true } },
            },
        });

        if (gradedSubmissions.length === 0) {
            return res.status(400).json({ message: "No graded submissions found. Grade at least one submission before generating insights." });
        }

        // ── Gather leaf-question metadata from the first evaluation's details ──
        const sampleDetails = gradedSubmissions[0]?.evaluation?.details || [];
        if (sampleDetails.length === 0) {
            return res.status(400).json({ message: "No evaluation details found. Use the manual evaluation grading panel to grade submissions." });
        }

        // Build canonical question list
        const questions = sampleDetails.map((d) => ({
            label: d.label,
            question_text: d.question_text || d.label,
            max_points: parseFloat(d.points) || 0,
        }));

        // ── Step 1: Extract topics per question via LLM ──
        const topicMap = await extractTopics(questions);

        // ── Step 2: Compute per-question class averages ──
        const questionScoreSums = {};
        const questionScoreCounts = {};
        questions.forEach((q) => {
            questionScoreSums[q.label] = 0;
            questionScoreCounts[q.label] = 0;
        });

        for (const sub of gradedSubmissions) {
            const details = sub.evaluation?.details || [];
            for (const d of details) {
                const score = parseFloat(d.score) || 0;
                if (questionScoreSums[d.label] !== undefined) {
                    questionScoreSums[d.label] += score;
                    questionScoreCounts[d.label] += 1;
                }
            }
        }

        const totalMarks = questions.reduce((s, q) => s + q.max_points, 0);

        const questionAverages = questions.map((q) => {
            const count = questionScoreCounts[q.label] || 1;
            const avg = questionScoreSums[q.label] / count;
            return {
                label: q.label,
                question_text: q.question_text,
                topic: topicMap[q.label] || q.question_text,
                avg_score: parseFloat(avg.toFixed(2)),
                max_points: q.max_points,
            };
        });

        // ── Step 3: Identify weak topics ──
        const weakTopics = [
            ...new Set(
                questionAverages
                    .filter((q) => q.max_points > 0 && q.avg_score / q.max_points < threshold)
                    .map((q) => q.topic)
            ),
        ];

        // ── Step 4: Per-student breakdown + LLM insights ──
        const studentData = {};
        const studentScores = [];

        for (const sub of gradedSubmissions) {
            const evalDetails = sub.evaluation?.details || [];
            const marksObtained = parseFloat(sub.evaluation?.total_score ?? sub.grade ?? 0);
            studentScores.push(marksObtained);

            const qBreakdown = evalDetails.map((d) => ({
                label: d.label,
                question_text: d.question_text || d.label,
                topic: topicMap[d.label] || d.question_text || d.label,
                score: parseFloat(d.score) || 0,
                max_points: parseFloat(d.points) || 0,
            }));

            // Per-student weak topics (where student < threshold)
            const studentWeakTopics = [
                ...new Set(
                    qBreakdown
                        .filter((q) => q.max_points > 0 && q.score / q.max_points < threshold)
                        .map((q) => q.topic)
                ),
            ];

            studentData[sub.user_id] = {
                student_name: sub.user.name,
                marks_obtained: marksObtained,
                total_marks: totalMarks,
                class_average: 0, // placeholder — filled below
                question_breakdown: qBreakdown,
                weak_topics: studentWeakTopics,
                llm_insight: "", // placeholder — filled below
            };
        }

        // Class average
        const classAverage = studentScores.length > 0
            ? parseFloat((studentScores.reduce((a, b) => a + b, 0) / studentScores.length).toFixed(2))
            : 0;

        // Fill in class average for each student
        for (const sid of Object.keys(studentData)) {
            studentData[sid].class_average = classAverage;
        }

        // ── Step 5: LLM calls — student insights (parallelised in small batches) ──
        const studentIds = Object.keys(studentData);
        const BATCH_SIZE = 5;
        for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
            const batch = studentIds.slice(i, i + BATCH_SIZE);
            await Promise.all(
                batch.map(async (sid) => {
                    const s = studentData[sid];
                    s.llm_insight = await generateStudentInsight(
                        s.student_name,
                        s.marks_obtained,
                        s.total_marks,
                        s.question_breakdown,
                        s.weak_topics
                    );
                })
            );
        }

        // ── Step 6: LLM call — teacher summary ──
        const llmSummary = await generateTeacherSummary(
            assessment.title,
            gradedSubmissions.length,
            classAverage,
            totalMarks,
            questionAverages,
            weakTopics
        );

        // ── Step 7: Build teacher data payload ──
        const studentBreakdown = gradedSubmissions.map((sub) => ({
            student_id: sub.user_id,
            name: sub.user.name,
            marks_obtained: studentData[sub.user_id].marks_obtained,
            total_marks: totalMarks,
        }));

        const teacherData = {
            class_average: classAverage,
            total_marks: totalMarks,
            graded_count: gradedSubmissions.length,
            student_breakdown: studentBreakdown,
            question_averages: questionAverages,
            weak_topics: weakTopics,
            threshold,
            llm_summary: llmSummary,
        };

        // ── Step 8: Upsert assessment_insights ──
        const insight = await prisma.assessment_insights.upsert({
            where: { assessment_id: assessmentId },
            update: {
                teacher_data: teacherData,
                student_data: studentData,
                generated_at: new Date(),
            },
            create: {
                assessment_id: assessmentId,
                teacher_data: teacherData,
                student_data: studentData,
                generated_at: new Date(),
            },
        });

        return res.status(200).json({
            message: "Insights generated successfully",
            insight,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * GET /api/courses/:courseId/assessments/:assessmentId/insights
 * TEACHER → full teacher_data + student_data
 * STUDENT → only their own entry from student_data
 */
export const getInsights = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        await verifyAssessmentInCourse(assessmentId, courseId);

        const insight = await prisma.assessment_insights.findUnique({
            where: { assessment_id: assessmentId },
        });

        if (!insight) {
            return res.status(404).json({ message: "No insights generated yet for this assessment." });
        }

        if (req.user.role === "TEACHER") {
            await verifyCourseOwner(courseId, req.user.id);
            return res.status(200).json({
                message: "Insights retrieved successfully",
                teacher_data: insight.teacher_data,
                student_data: insight.student_data,
                generated_at: insight.generated_at,
            });
        } else {
            // Student
            await verifyStudentEnrolled(courseId, req.user.id);
            const myData = insight.student_data?.[req.user.id] || null;
            return res.status(200).json({
                message: myData ? "Insights retrieved successfully" : "No insights available for you yet.",
                student_insight: myData,
                generated_at: insight.generated_at,
            });
        }
    } catch (error) {
        return handleError(res, error);
    }
};
