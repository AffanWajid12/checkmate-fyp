import axios from "axios";

const MATH_GRADER_URL =
    process.env.MATH_GRADER_URL || "http://127.0.0.1:5007";

/**
 * POST /api/math/grade
 *
 * JSON body:
 *   - rubric           (string)  Grading rubric / marking criteria
 *   - question         (string)  The math question posed to the student
 *   - model_solution   (string)  Reference / model answer
 *   - student_solution (string)  The student's submitted answer
 *   - score_threshold     (number, optional, default 70)
 *   - strictness_threshold (number, optional, default 3)
 */
export const gradeMath = async (req, res) => {
    try {
        const {
            rubric,
            question,
            model_solution,
            student_solution,
            score_threshold,
            strictness_threshold,
        } = req.body;

        const missing = ["rubric", "question", "model_solution", "student_solution"].filter(
            (f) => !req.body[f]
        );
        if (missing.length) {
            return res
                .status(400)
                .json({ error: `Missing required fields: ${missing.join(", ")}` });
        }

        const payload = {
            rubric,
            question,
            model_solution,
            student_solution,
            ...(score_threshold !== undefined && { score_threshold }),
            ...(strictness_threshold !== undefined && { strictness_threshold }),
        };

        const response = await axios.post(
            `${MATH_GRADER_URL}/api/grade`,
            payload,
            {
                headers: { "Content-Type": "application/json" },
                timeout: 120000, // 2-minute timeout for LLM chains
            }
        );

        return res.status(200).json(response.data);
    } catch (err) {
        console.error("Math Grader error:", err.response?.data || err.message);
        return res.status(500).json({
            error: "Math grading failed",
            details: err.response?.data?.error || err.message,
        });
    }
};
