
import { Router } from "express";
import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js";

import {
    generateAssessment,
    getGeneratedAssessments,
    getGeneratedAssessment,
    exportAssessmentDocx,
} from "../controllers/generationController.js";

const router = Router();

/**
 * Assessment Generation
 * (Teacher only)
 */

// POST /api/assessments/generate — generate an assessment
router.post(
    "/generate",
    verifyUser,
    verifyUserType("TEACHER"),
    generateAssessment
);

/**
 * Generated Assessment Retrieval
 * (Teacher only)
 */

// GET /api/generated-assessments — list all generated assessments
router.get(
    "/",
    verifyUser,
    verifyUserType("TEACHER"),
    getGeneratedAssessments
);

// GET /api/generated-assessments/:id — retrieve a specific generated assessment
router.get(
    "/:id",
    verifyUser,
    verifyUserType("TEACHER"),
    getGeneratedAssessment
);

/**
 * DOCX Export
 */

// GET /api/generated-assessments/:id/export.docx — export to DOCX
router.get(
    "/:id/export.docx",
    verifyUser,
    verifyUserType("TEACHER"),
    exportAssessmentDocx
);

export default router;
