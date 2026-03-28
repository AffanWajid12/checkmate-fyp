// filepath: c:\Users\Administrator\Desktop\FYP\checkmate-fyp\backend\src\routes\generationRoutes.js

import { Router } from "express";
import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js";
import { uploadMultiple } from "../middleware/uploadMiddleware.js";

import {
    uploadReferenceMaterials,
    getReferenceMaterials,
    deleteReferenceMaterial,
    generateAssessment,
    getGeneratedAssessments,
    getGeneratedAssessment,
    exportAssessmentDocx,
} from "../controllers/generationController.js";

const router = Router();

/**
 * Reference Materials Management
 * (Teacher only)
 */

// POST /api/reference-materials — upload files
router.post(
    "/",
    verifyUser,
    verifyUserType("TEACHER"),
    uploadMultiple,
    uploadReferenceMaterials
);

// GET /api/reference-materials — list teacher's materials
router.get(
    "/",
    verifyUser,
    verifyUserType("TEACHER"),
    getReferenceMaterials
);

// DELETE /api/reference-materials/:id — delete a material
router.delete(
    "/:id",
    verifyUser,
    verifyUserType("TEACHER"),
    deleteReferenceMaterial
);

export default router;
