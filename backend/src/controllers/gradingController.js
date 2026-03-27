import axios from 'axios';
import prisma from '../config/prismaClient.js';
import supabase from '../config/supabaseClient.js';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { verifyCourseOwner, verifyAssessmentInCourse, generateSignedUrl, handleError } from '../utils/courseHelpers.js';

const QA_PAIRING_SERVICE_URL = process.env.QA_PAIRING_SERVICE_URL || 'http://127.0.0.1:5002';

/**
 * POST /api/courses/:courseId/assessments/:assessmentId/extract-questions
 * Teacher only — downloads source material PDFs from Supabase and sends them
 * to the QA-Pairing Flask service for question extraction.
 */
export const extractQuestions = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        await verifyCourseOwner(courseId, req.user.id);
        const assessment = await verifyAssessmentInCourse(assessmentId, courseId);

        const sourceMaterials = assessment.source_materials ?? [];
        if (sourceMaterials.length === 0) {
            return res.status(400).json({ message: "No source materials found for this assessment. Upload a PDF first." });
        }

        // Download source material files from Supabase
        const formData = new FormData();
        let fileCount = 0;

        for (const material of sourceMaterials) {
            // Only process PDFs
            if (material.mime_type !== 'application/pdf') continue;

            const signedUrl = await generateSignedUrl('source-materials', material.bucket_path);
            if (!signedUrl) continue;

            try {
                const fileResponse = await axios.get(signedUrl, { responseType: 'arraybuffer' });
                formData.append('files', Buffer.from(fileResponse.data), {
                    filename: material.file_name,
                    contentType: material.mime_type,
                });
                fileCount++;
            } catch (err) {
                console.error(`Failed to download ${material.file_name}:`, err.message);
            }
        }

        if (fileCount === 0) {
            return res.status(400).json({ message: "No valid PDF source materials could be retrieved." });
        }

        // Optional: pass is_scanned flag from request body
        const isScanned = req.body?.is_scanned || 'no';
        formData.append('is_scanned', isScanned);

        // Call Flask service
        const response = await axios.post(
            `${QA_PAIRING_SERVICE_URL}/extract-questions`,
            formData,
            {
                headers: { ...formData.getHeaders() },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 600000, // 10 minutes — Ollama can be slow
            }
        );

        return res.status(200).json({
            message: "Questions extracted successfully",
            questions: response.data,
        });

    } catch (error) {
        if (error.response?.status) {
            return res.status(error.response.status).json({
                message: error.response.data?.error || "QA-Pairing service error",
            });
        }
        return handleError(res, error);
    }
};

/**
 * POST /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/pair-answers
 * Teacher only — downloads a student's submission attachments from Supabase and sends them
 * along with the questions JSON to the QA-Pairing Flask service for answer pairing.
 * Body: { questions: [...] } — the edited/confirmed questions JSON array
 */
export const pairStudentAnswers = async (req, res) => {
    try {
        const { courseId, assessmentId, submissionId } = req.params;
        const { questions } = req.body;

        if (!questions || !Array.isArray(questions)) {
            return res.status(400).json({ message: "questions array is required in request body" });
        }

        await verifyCourseOwner(courseId, req.user.id);
        await verifyAssessmentInCourse(assessmentId, courseId);

        // Get the submission with attachments
        const submission = await prisma.submissions.findUnique({
            where: { id: submissionId },
            include: {
                attachments: true,
                user: { select: { id: true, name: true, email: true } },
            },
        });

        if (!submission || submission.assessment_id !== assessmentId) {
            return res.status(404).json({ message: "Submission not found" });
        }

        if (!submission.attachments || submission.attachments.length === 0) {
            return res.status(400).json({ message: "No attachments found in this submission" });
        }

        // Download student files from Supabase
        const combineFormData = new FormData();
        let fileCount = 0;

        for (const att of submission.attachments) {
            if (att.file_name === 'combined_submission.pdf') continue;

            const signedUrl = await generateSignedUrl('submission-files', att.bucket_path);
            if (!signedUrl) continue;

            try {
                const fileResponse = await axios.get(signedUrl, { responseType: 'arraybuffer' });
                combineFormData.append('files', Buffer.from(fileResponse.data), {
                    filename: att.file_name,
                    contentType: att.mime_type,
                });
                fileCount++;
            } catch (err) {
                console.error(`Failed to download ${att.file_name}:`, err.message);
            }
        }

        if (fileCount === 0 && !submission.attachments.find(a => a.file_name === 'combined_submission.pdf')) {
            return res.status(400).json({ message: "No valid files could be retrieved from this submission" });
        }

        let combinedPdfBuffer = null;
        let combinedAttachment = submission.attachments.find(a => a.file_name === 'combined_submission.pdf');

        if (fileCount > 0) {
            // Send files to Python service to combine into a single PDF
            try {
                const combineResponse = await axios.post(
                    `${QA_PAIRING_SERVICE_URL}/combine-to-pdf`,
                    combineFormData,
                    {
                        headers: { ...combineFormData.getHeaders() },
                        responseType: 'arraybuffer',
                        maxBodyLength: Infinity,
                        timeout: 600000,
                    }
                );
                combinedPdfBuffer = Buffer.from(combineResponse.data);

                // Upload to Supabase
                const storagePath = combinedAttachment 
                    ? combinedAttachment.bucket_path 
                    : `${courseId}/${assessmentId}/${submission.id}/${uuidv4()}.pdf`;

                const { error: uploadError } = await supabase.storage
                    .from('submission-files')
                    .upload(storagePath, combinedPdfBuffer, {
                        contentType: 'application/pdf',
                        upsert: true,
                    });

                if (uploadError) {
                    throw new Error(`Combined PDF upload failed: ${uploadError.message}`);
                }

                if (!combinedAttachment) {
                    combinedAttachment = await prisma.attachments.create({
                        data: {
                            bucket_path: storagePath,
                            file_name: 'combined_submission.pdf',
                            file_size: combinedPdfBuffer.length,
                            mime_type: 'application/pdf',
                            submission_id: submission.id,
                        },
                    });
                }
            } catch (err) {
                console.error('Failed to combine and upload files:', err);
                return res.status(500).json({ message: "Failed to combine submission files into PDF.", error: err.message });
            }
        } else {
            // Use existing combined attachment
            const signedUrl = await generateSignedUrl('submission-files', combinedAttachment.bucket_path);
            if (!signedUrl) return res.status(500).json({ message: "Could not access combined submission PDF." });
            const fileResponse = await axios.get(signedUrl, { responseType: 'arraybuffer' });
            combinedPdfBuffer = Buffer.from(fileResponse.data);
        }

        // Send combined PDF to Python service for QA pairing
        const pairFormData = new FormData();
        pairFormData.append('files', combinedPdfBuffer, {
            filename: 'combined_submission.pdf',
            contentType: 'application/pdf',
        });
        pairFormData.append('questions', JSON.stringify(questions));

        // Optional: pass is_scanned flag from request body
        const isScanned = req.body?.is_scanned || 'yes';
        pairFormData.append('is_scanned', isScanned);

        // Call Flask service
        const response = await axios.post(
            `${QA_PAIRING_SERVICE_URL}/pair-answers`,
            pairFormData,
            {
                headers: { ...pairFormData.getHeaders() },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 600000,
            }
        );

        // Get signed URL to return to frontend for viewing
        const combinedSignedUrl = await generateSignedUrl('submission-files', combinedAttachment.bucket_path);

        return res.status(200).json({
            message: "Answers paired successfully",
            student: {
                id: submission.user.id,
                name: submission.user.name,
                email: submission.user.email,
            },
            combined_pdf_url: combinedSignedUrl,
            results: response.data,
        });

    } catch (error) {
        if (error.response?.status) {
            return res.status(error.response.status).json({
                message: error.response.data?.error || "QA-Pairing service error",
            });
        }
        return handleError(res, error);
    }
};
