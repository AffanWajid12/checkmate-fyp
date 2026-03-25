import axios from 'axios';
import prisma from '../config/prismaClient.js';
import FormData from 'form-data';
import { verifyCourseOwner, generateSignedUrl, handleError } from '../utils/courseHelpers.js';

const PLAGIARISM_SERVICE_URL = process.env.PLAGIARISM_SERVICE_URL || 'http://localhost:5001/api/check-plagiarism';

export const runPlagiarismCheck = async (req, res) => {
    try {
        const { courseId, assessmentId } = req.params;

        // Verify teacher owns the course
        await verifyCourseOwner(courseId, req.user.id);

        // Fetch all submissions for this assessment with their attachments
        const submissions = await prisma.submissions.findMany({
            where: { assessment_id: assessmentId },
            include: {
                attachments: true,
                user: {
                    select: { name: true }
                }
            }
        });

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ message: "No submissions found for this assessment." });
        }

        // Collect all files to check
        const filesToCheck = [];

        for (const sub of submissions) {
            const studentName = sub.user.name || 'Unknown Student';
            for (const att of sub.attachments) {
                // Generate a signed URL to download the file from Supabase
                const signedUrl = await generateSignedUrl('submission-files', att.bucket_path);
                if (signedUrl) {
                    try {
                        // Download the file into memory
                        const fileResponse = await axios.get(signedUrl, { responseType: 'arraybuffer' });
                        filesToCheck.push({
                            buffer: Buffer.from(fileResponse.data),
                            originalname: att.file_name,
                            mimetype: att.mime_type,
                            studentName: studentName
                        });
                    } catch (err) {
                        console.error(`Failed to download ${att.file_name} from Supabase:`, err.message);
                    }
                }
            }
        }

        if (filesToCheck.length === 0) {
            return res.status(400).json({ message: "No valid files could be retrieved for analysis." });
        }

        // Prepare multipart form data for the Python service
        const formData = new FormData();
        filesToCheck.forEach((file, index) => {
            formData.append('files', file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
            });
            // Send student name metadata so the Python service can return it mapped
            formData.append(`studentName_${index}`, file.studentName);
        });

        // Call the Python Plagiarism Service
        const response = await axios.post(PLAGIARISM_SERVICE_URL, formData, {
            headers: {
                ...formData.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        return res.status(200).json({
            message: "Plagiarism analysis completed successfully.",
            results: response.data.results
        });

    } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 500) {
           return res.status(error.response.status).json({ message: error.response.data.error || "Plagiarism service error" });
        }
        return handleError(res, error);
    }
};
