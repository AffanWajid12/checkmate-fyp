import { Router } from "express";
import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";

const router = Router();
const GRADING_SERVICE_URL = process.env.GRADING_SERVICE_URL || "http://127.0.0.1:5004";
console.log("--> Grading Service Registered at:", GRADING_SERVICE_URL);

const upload = multer({ storage: multer.memoryStorage() });

// Helper to proxy requests to the Python grading service
const proxyToGradingService = async (req, res, endpoint) => {
    try {
        const response = await axios.post(`${GRADING_SERVICE_URL}${endpoint}`, req.body, {
            timeout: 120000,
        });
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`--> ERROR in Grading Proxy (${endpoint}):`, error.message);
        if (error.response) {
            console.error("--> Service Data:", error.response.data);
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ error: "Grading Service Unreachable", details: error.message });
    }
};

/**
 * AI Rubric Generation
 */
router.post(
    "/generate-rubric",
    verifyUser,
    verifyUserType("TEACHER"),
    (req, res) => proxyToGradingService(req, res, "/generate_question_rubric")
);

router.post(
    "/generate-rubrics-bulk",
    verifyUser,
    verifyUserType("TEACHER"),
    (req, res) => proxyToGradingService(req, res, "/generate_rubrics_bulk")
);

/**
 * AI Grading
 */
router.post(
    "/grade",
    verifyUser,
    verifyUserType("TEACHER"),
    (req, res) => proxyToGradingService(req, res, "/grade")
);

/**
 * Grading Resources (RAG)
 */
router.post(
    "/upload-resource",
    verifyUser,
    verifyUserType("TEACHER"),
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: "No file uploaded" });
            const { assessmentId } = req.body;
            if (!assessmentId) return res.status(400).json({ error: "Missing assessmentId" });

            const formData = new FormData();
            formData.append("file", req.file.buffer, req.file.originalname);
            formData.append("assessment_id", assessmentId);

            const response = await axios.post(`${GRADING_SERVICE_URL}/upload_grading_resource`, formData, {
                headers: formData.getHeaders(),
            });

            res.status(response.status).json(response.data);
        } catch (error) {
            console.error("Error uploading grading resource:", error.message);
            res.status(500).json({ error: error.response?.data?.error || "Failed to upload resource" });
        }
    }
);

router.get(
    "/resources/:assessmentId",
    verifyUser,
    verifyUserType("TEACHER"),
    async (req, res) => {
        try {
            const { assessmentId } = req.params;
            const response = await axios.get(`${GRADING_SERVICE_URL}/get_grading_resources?assessment_id=${assessmentId}`);
            res.status(response.status).json(response.data);
        } catch (error) {
            console.error("--> ERROR fetching grading resources:", error.message);
            res.status(500).json({ error: "Failed to fetch resources", details: error.message });
        }
    }
);

router.post(
    "/clear-resources",
    verifyUser,
    verifyUserType("TEACHER"),
    (req, res) => {
        const { assessmentId } = req.body;
        if (!assessmentId) return res.status(400).json({ error: "Missing assessmentId" });
        return proxyToGradingService(req, res, "/clear_grading_resources");
    }
);

// Health check for the proxy
router.get("/health", (req, res) => {
    res.json({ status: "Grading proxy is active", service: GRADING_SERVICE_URL });
});

export default router;
