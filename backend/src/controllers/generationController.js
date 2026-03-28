
import prisma from "../config/prismaClient.js";
import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
import { handleError, generateSignedUrl } from "../utils/courseHelpers.js";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

const _safeFilename = (name) => {
    const base = String(name ?? "")
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "-")
        .replace(/\s+/g, " ")
        .slice(0, 80);
    return base || "generated-assessment";
};

const _getExportQuestions = (questionPayload) => {
    if (Array.isArray(questionPayload)) return questionPayload;
    if (questionPayload && typeof questionPayload === "object" && Array.isArray(questionPayload.questions)) {
        return questionPayload.questions;
    }
    return [];
};

const _renderText = (value) => String(value ?? "").toString();

const _buildDocxFromGeneratedAssessment = (assessment) => {
    const title = assessment.title || `${assessment.subject} - ${assessment.difficulty} ${assessment.assessment_type}`;
    const questions = _getExportQuestions(assessment.question_payload);

    const children = [];

    children.push(
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: `Subject: ${_renderText(assessment.subject)}  ` }),
                new TextRun({ text: `Type: ${_renderText(assessment.assessment_type)}  ` }),
                new TextRun({ text: `Difficulty: ${_renderText(assessment.difficulty)}` }),
            ],
        })
    );

    if (assessment.instructions) {
        children.push(
            new Paragraph({
                text: "Instructions",
                heading: HeadingLevel.HEADING_2,
            })
        );
        children.push(new Paragraph({ text: _renderText(assessment.instructions) }));
    }

    children.push(
        new Paragraph({
            text: "Questions",
            heading: HeadingLevel.HEADING_2,
        })
    );

    questions.forEach((q, idx) => {
        const index = q.index ?? idx + 1;
        const type = q.type ?? q.questionType ?? "mcq";
        const marks = q.marks ?? 1;
        const difficulty = q.difficulty ?? assessment.difficulty;
        const text = q.text ?? q.questionText ?? "";

        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `Q${index}. `, bold: true }),
                    new TextRun({ text: _renderText(text) }),
                ],
            })
        );

        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Type: ${_renderText(type)}  Marks: ${_renderText(marks)}  Difficulty: ${_renderText(difficulty)}`,
                        italics: true,
                    }),
                ],
            })
        );

        const options = q.options;
        if ((type === "mcq" || type === "MCQ") && Array.isArray(options) && options.length) {
            options.forEach((opt, i) => {
                const label = String.fromCharCode(65 + i);
                children.push(
                    new Paragraph({
                        text: `${label}. ${_renderText(opt)}`,
                        bullet: { level: 0 },
                    })
                );
            });
        }

        const expectedAnswer = q.expectedAnswer ?? q.expected_answer ?? q.answer ?? "";
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "Expected answer: ", bold: true }),
                    new TextRun({ text: _renderText(expectedAnswer) }),
                ],
            })
        );

        children.push(new Paragraph({ text: "" }));
    });

    return new Document({
        sections: [{ properties: {}, children }],
    });
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * REFERENCE MATERIALS MANAGEMENT
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * POST /api/reference-materials
 * Upload reference material files for a teacher
 * Multipart upload using existing uploadMultiple middleware
 */
export const uploadReferenceMaterials = async (req, res) => {
    try {
        const teacherId = req.user.id;

        // Validate that files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        // Upload files to Supabase and create database records
        const uploadedMaterials = [];

        for (const file of req.files) {
            const ext = file.originalname.split(".").pop();
            const storagePath = `reference-materials/${teacherId}/${uuidv4()}.${ext}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("source-materials")
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false,
                });

            if (uploadError) {
                throw {
                    status: 500,
                    message: `File upload failed: ${uploadError.message}`,
                };
            }

            // Create reference_materials record
            const material = await prisma.reference_materials.create({
                data: {
                    bucket_path: storagePath,
                    file_name: file.originalname,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    teacher_id: teacherId,
                },
            });

            uploadedMaterials.push(material);
        }

        return res.status(201).json({
            message: "Reference materials uploaded successfully",
            materials: uploadedMaterials,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * GET /api/reference-materials
 * List teacher's uploaded reference materials
 * Optional query: courseId (for filtering — currently materials are not tied to courses)
 */
export const getReferenceMaterials = async (req, res) => {
    try {
        const teacherId = req.user.id;

        // Query builder
        const where = { teacher_id: teacherId };

        const materials = await prisma.reference_materials.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        // Generate signed URLs for all materials
        const materialsWithUrls = await Promise.all(
            materials.map(async (material) => ({
                ...material,
                signed_url: await generateSignedUrl("source-materials", material.bucket_path),
            }))
        );

        return res.status(200).json({
            message: "Reference materials retrieved successfully",
            materials: materialsWithUrls,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * DELETE /api/reference-materials/:id
 * Delete a reference material (optional endpoint per integration plan)
 */
export const deleteReferenceMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;

        // Verify material exists and belongs to teacher
        const material = await prisma.reference_materials.findUnique({
            where: { id },
        });

        if (!material) {
            return res.status(404).json({ message: "Reference material not found" });
        }

        if (material.teacher_id !== teacherId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Delete from Supabase Storage
        const { error: deleteError } = await supabase.storage
            .from("source-materials")
            .remove([material.bucket_path]);

        if (deleteError) {
            console.warn(`Supabase delete warning: ${deleteError.message}`);
            // Don't throw — proceed with DB deletion anyway
        }

        // Delete from database (join table entries cascade-deleted)
        await prisma.reference_materials.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Reference material deleted successfully",
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ASSESSMENT GENERATION
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Normalize microservice response into a stable internal format
 * Converts microservice questions[] into frontend-renderable structure
 */
const normalizeQuestions = (microserviceQuestions) => {
    return (microserviceQuestions || []).map((q, index) => ({
        index: index + 1,
        type: q.questionType || q.type || "mcq",
        text: q.questionText || q.text || "",
        options: q.options || [],
        expectedAnswer: q.expectedAnswer || q.answer || "",
        marks: q.marks || 1,
        difficulty: q.difficulty || "medium",
    }));
};

/**
 * POST /api/assessments/generate
 * Main generation endpoint — orchestrates backend to microservice call
 *
 * Request body:
 * {
 *   subject: string,
 *   assessmentType: "quiz" | "assignment" | "exam",
 *   difficulty: "easy" | "medium" | "hard",
 *   questionTypeCounts: { mcq: number, short_text?: number, essay?: number, ... },
 *   instructions?: string,
 *   referenceMaterialIds?: string[] (UUIDs)
 * }
 */
export const generateAssessment = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const {
            subject,
            assessmentType,
            difficulty,
            questionTypeCounts,
            instructions,
            referenceMaterialIds,
        } = req.body;

        // ───── Validation ─────
        if (!subject || typeof subject !== "string") {
            return res.status(400).json({ message: "Subject (string) is required" });
        }

        const validTypes = ["quiz", "assignment", "exam"];
        const normalizedType = assessmentType?.toLowerCase();
        if (!validTypes.includes(normalizedType)) {
            return res.status(400).json({
                message: `Assessment type must be one of: ${validTypes.join(", ")}`,
            });
        }

        const validDifficulties = ["easy", "medium", "hard"];
        if (!validDifficulties.includes(difficulty)) {
            return res.status(400).json({
                message: `Difficulty must be one of: ${validDifficulties.join(", ")}`,
            });
        }

        if (!questionTypeCounts || typeof questionTypeCounts !== "object") {
            return res.status(400).json({
                message: "questionTypeCounts object is required",
            });
        }

        // Validate counts are numbers and sum > 0
        const counts = Object.values(questionTypeCounts);
        const totalCount = counts.reduce((sum, c) => sum + (Number(c) || 0), 0);

        if (totalCount === 0) {
            return res.status(400).json({
                message: "Total question count must be greater than 0",
            });
        }

        if (!counts.every((c) => typeof c === "number" && c >= 0)) {
            return res.status(400).json({
                message: "All question counts must be non-negative numbers",
            });
        }

        // ───── Resolve reference materials to signed URLs ─────
        let referenceMaterials = [];

        if (referenceMaterialIds && Array.isArray(referenceMaterialIds)) {
            // Fetch all referenced materials
            const materials = await prisma.reference_materials.findMany({
                where: {
                    id: { in: referenceMaterialIds },
                    teacher_id: teacherId, // Security: only teacher's own materials
                },
            });

            // Verify all IDs were found
            if (materials.length !== referenceMaterialIds.length) {
                return res.status(400).json({
                    message: "One or more reference material IDs are invalid or not accessible",
                });
            }

            // Generate signed URLs for each material
            referenceMaterials = await Promise.all(
                materials.map(async (m) => ({
                    url: await generateSignedUrl("source-materials", m.bucket_path),
                    fileName: m.file_name,
                }))
            );

            // Filter out any failed URL generations
            referenceMaterials = referenceMaterials.filter((m) => m.url);
        }

        // ───── Call microservice ─────
        const microserviceUrl = process.env.ASSESSMENT_GENERATION_SERVICE_URL;
        if (!microserviceUrl) {
            return res.status(500).json({
                message: "Assessment generation service not configured",
            });
        }

        const microservicePayload = {
            subject,
            assessmentType: normalizedType,
            difficulty,
            questionTypeCounts,
            instructions: instructions || undefined,
            referenceMaterials: referenceMaterials.length > 0 ? referenceMaterials : undefined,
        };

        let microserviceResponse;
        try {
            const fetchResponse = await fetch(`${microserviceUrl}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(microservicePayload),
                timeout: 120000, // 2 minutes for LLM generation
            });

            if (!fetchResponse.ok) {
                const errorData = await fetchResponse.text();
                throw new Error(
                    `Microservice error (${fetchResponse.status}): ${errorData}`
                );
            }

            microserviceResponse = await fetchResponse.json();
        } catch (err) {
            console.error("Microservice call failed:", err.message);
            return res.status(503).json({
                message: "Failed to generate assessment. Please try again.",
                error: err.message,
            });
        }

        // ───── Normalize microservice response ─────
        if (!microserviceResponse.questions || !Array.isArray(microserviceResponse.questions)) {
            return res.status(502).json({
                message: "Invalid response from generation service",
            });
        }

        const normalizedQuestions = normalizeQuestions(microserviceResponse.questions);

        // Verify question count matches request
        if (normalizedQuestions.length !== totalCount) {
            console.warn(
                `Question count mismatch: requested ${totalCount}, got ${normalizedQuestions.length}`
            );
            // Log but proceed — frontend will handle gracefully
        }

        // ───── Persist to database ─────
        const title = `${subject} - ${difficulty} ${normalizedType}`;

        const generatedAssessment = await prisma.generated_assessments.create({
            data: {
                title,
                subject,
                assessment_type: normalizedType.toUpperCase(),
                difficulty,
                instructions: instructions || null,
                question_count: normalizedQuestions.length,
                question_payload: normalizedQuestions,
                status: "draft",
                teacher_id: teacherId,
                // Attach reference materials via join table
                reference_materials:
                    referenceMaterialIds && referenceMaterialIds.length > 0
                        ? {
                              create: referenceMaterialIds.map((refId) => ({
                                  reference_material_id: refId,
                              })),
                          }
                        : undefined,
            },
            include: {
                reference_materials: {
                    include: {
                        reference_material: true,
                    },
                },
            },
        });

        // ───── Return response ─────
        return res.status(201).json({
            message: "Assessment generated successfully",
            generatedAssessment: {
                id: generatedAssessment.id,
                teacherId: generatedAssessment.teacher_id,
                title: generatedAssessment.title,
                subject: generatedAssessment.subject,
                assessmentType: generatedAssessment.assessment_type,
                difficulty: generatedAssessment.difficulty,
                instructions: generatedAssessment.instructions,
                createdAt: generatedAssessment.createdAt,
                questions: normalizedQuestions,
            },
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GENERATED ASSESSMENT RETRIEVAL
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * GET /api/generated-assessments
 * List all generated assessments for the teacher
 */
export const getGeneratedAssessments = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const assessments = await prisma.generated_assessments.findMany({
            where: { teacher_id: teacherId },
            include: {
                reference_materials: {
                    include: {
                        reference_material: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const assessmentsFormatted = assessments.map((a) => ({
            id: a.id,
            teacherId: a.teacher_id,
            title: a.title,
            subject: a.subject,
            assessmentType: a.assessment_type,
            difficulty: a.difficulty,
            instructions: a.instructions,
            questionCount: a.question_count,
            status: a.status,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        }));

        return res.status(200).json({
            message: "Generated assessments retrieved successfully",
            assessments: assessmentsFormatted,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * GET /api/generated-assessments/:id
 * Retrieve a single generated assessment with full questions
 */
export const getGeneratedAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;

        const assessment = await prisma.generated_assessments.findUnique({
            where: { id },
            include: {
                reference_materials: {
                    include: {
                        reference_material: true,
                    },
                },
            },
        });

        if (!assessment) {
            return res.status(404).json({ message: "Generated assessment not found" });
        }

        // Authorization: must be teacher's own assessment
        if (assessment.teacher_id !== teacherId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        return res.status(200).json({
            message: "Generated assessment retrieved successfully",
            generatedAssessment: {
                id: assessment.id,
                teacherId: assessment.teacher_id,
                title: assessment.title,
                subject: assessment.subject,
                assessmentType: assessment.assessment_type,
                difficulty: assessment.difficulty,
                instructions: assessment.instructions,
                questionCount: assessment.question_count,
                status: assessment.status,
                createdAt: assessment.createdAt,
                updatedAt: assessment.updatedAt,
                questions: assessment.question_payload,
                referenceMaterialIds: assessment.reference_materials.map((r) => r.reference_material_id),
            },
        });
    } catch (error) {
        return handleError(res, error);
    }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DOCX EXPORT (stub for now — full implementation in Phase 3)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * GET /api/generated-assessments/:id/export.docx
 * Export a generated assessment to DOCX format
 * (Stub — uses stored payload; no LLM call)
 */
export const exportAssessmentDocx = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;

        const assessment = await prisma.generated_assessments.findUnique({
            where: { id },
        });

        if (!assessment) {
            return res.status(404).json({ message: "Generated assessment not found" });
        }

        if (assessment.teacher_id !== teacherId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const doc = _buildDocxFromGeneratedAssessment(assessment);
        const buffer = await Packer.toBuffer(doc);

        const filename = `${_safeFilename(assessment.title || assessment.subject)}.docx`;
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(200).send(buffer);
    } catch (error) {
        return handleError(res, error);
    }
};
