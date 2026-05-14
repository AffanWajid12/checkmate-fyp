import { Router } from "express";
import multer from "multer";
import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js";
import { evaluateOMR } from "../controllers/omrController.js";

const router = Router();

// Store uploaded images in memory so we can forward them to the Python service
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB per image
        files: 100,                  // up to 100 sheets per batch
    },
});

/**
 * POST /api/omr/evaluate
 * Grades a batch of OMR sheet images against a provided answer key.
 */
router.post(
    "/evaluate",
    verifyUser,
    verifyUserType("TEACHER"),
    upload.array("images"),
    evaluateOMR
);

export default router;
