import { Router } from "express";
import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js";
import { gradeMath } from "../controllers/mathController.js";

const router = Router();

/**
 * POST /api/math/grade
 * Grades a single student math solution against a model answer + rubric.
 */
router.post(
    "/grade",
    verifyUser,
    verifyUserType("TEACHER"),
    gradeMath
);

export default router;
