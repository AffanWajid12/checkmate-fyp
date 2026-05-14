import axios from "axios";
import FormData from "form-data";

const OMR_SERVICE_URL =
    process.env.OMR_SERVICE_URL || "http://127.0.0.1:8543";

import fs from 'fs';
import path from 'path';

// Standard template for the physical OMR sheets (Using sample1 template for testing)
const templatePath = path.resolve(process.cwd(), '../services/omr-checker/OMRChecker/samples/sample1/template.json');
let STANDARD_TEMPLATE = {};
try {
    STANDARD_TEMPLATE = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
} catch (err) {
    console.error("Failed to load STANDARD_TEMPLATE:", err);
}

/**
 * Build the evaluation JSON config from the answer key supplied by the teacher.
 * answerKey: Array of strings like ["A","B","C","D", ...]  (1-indexed by position)
 */
function buildEvaluationConfig(answerKey) {
    const answersInOrder = answerKey.map((ans) => ans.toUpperCase());
    return {
        source_type: "custom",
        options: {
            questions_in_order: ["q1..20"],
            answers_in_order: answersInOrder,
        },
        marking_schemes: {
            DEFAULT: {
                correct: "1",
                incorrect: "0",
                unmarked: "0",
            },
        },
    };
}

/**
 * POST /api/omr/evaluate
 *
 * Multipart form data:
 *   - answerKey   (JSON string)   e.g. ["A","C","B","D",...]
 *   - title       (string)        Assessment name
 *   - images      (multiple files)
 */
export const evaluateOMR = async (req, res) => {
    try {
        const { answerKey: answerKeyRaw, title } = req.body;
        const images = req.files;

        if (!answerKeyRaw) {
            return res.status(400).json({ error: "Missing answerKey field" });
        }
        if (!images || images.length === 0) {
            return res
                .status(400)
                .json({ error: "No images uploaded for grading" });
        }

        let answerKey;
        try {
            answerKey = JSON.parse(answerKeyRaw);
        } catch {
            return res
                .status(400)
                .json({ error: "answerKey must be a valid JSON array" });
        }

        if (!Array.isArray(answerKey) || answerKey.length === 0) {
            return res
                .status(400)
                .json({ error: "answerKey must be a non-empty array" });
        }

        const template = { ...STANDARD_TEMPLATE };
        const evaluation = buildEvaluationConfig(answerKey);

        const templateStr = JSON.stringify(template);
        const evaluationStr = JSON.stringify(evaluation);

        // Process images in parallel (up to 5 at a time to avoid overloading)
        const CONCURRENCY = 5;
        const results = [];

        for (let i = 0; i < images.length; i += CONCURRENCY) {
            const batch = images.slice(i, i + CONCURRENCY);
            const batchResults = await Promise.all(
                batch.map(async (file) => {
                    const formData = new FormData();
                    formData.append("image", file.buffer, {
                        filename: file.originalname,
                        contentType: file.mimetype,
                    });
                    formData.append("template", templateStr);
                    formData.append("evaluation", evaluationStr);

                    try {
                        const response = await axios.post(
                            `${OMR_SERVICE_URL}/api/evaluate-single-omr`,
                            formData,
                            {
                                headers: formData.getHeaders(),
                                timeout: 120000,
                            }
                        );

                        const data = response.data;
                        const raw = data.raw_omr_results || {};

                        // Calculate score by comparing answers
                        let score = 0;
                        answerKey.forEach((correct, idx) => {
                            const qKey = `q${idx + 1}`;
                            if (
                                raw[qKey] &&
                                raw[qKey].toString().toUpperCase() ===
                                    correct.toUpperCase()
                            ) {
                                score++;
                            }
                        });

                        return {
                            filename: file.originalname,
                            status: "success",
                            score,
                            total: answerKey.length,
                            percentage: Math.round(
                                (score / answerKey.length) * 100
                            ),
                            raw_results: raw,
                        };
                    } catch (err) {
                        const errDetail =
                            err.response?.data?.error || err.message;
                        return {
                            filename: file.originalname,
                            status: "error",
                            error: errDetail,
                        };
                    }
                })
            );
            results.push(...batchResults);
        }

        const successCount = results.filter(
            (r) => r.status === "success"
        ).length;
        const failCount = results.filter((r) => r.status === "error").length;

        return res.status(200).json({
            title: title || "OMR Evaluation",
            total_questions: answerKey.length,
            total_sheets: images.length,
            processed: successCount,
            failed: failCount,
            results,
        });
    } catch (err) {
        console.error("OMR Evaluation error:", err);
        return res
            .status(500)
            .json({ error: "Internal server error", details: err.message });
    }
};
