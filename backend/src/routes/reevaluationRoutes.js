import { Router } from "express";
import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js";
import {
    requestReevaluation,
    getStudentRequests,
    getTeacherPendingRequests,
    getTeacherAllRequests,
    respondToRequest,
} from "../controllers/reevaluationController.js";

const router = Router();

// ─── Student Routes ──────────────────────────────────────────────────────────
router.post("/request", verifyUser, verifyUserType("STUDENT"), requestReevaluation);
router.get("/student/my-requests", verifyUser, verifyUserType("STUDENT"), getStudentRequests);

// ─── Teacher Routes ──────────────────────────────────────────────────────────
router.get("/teacher/pending", verifyUser, verifyUserType("TEACHER"), getTeacherPendingRequests);
router.get("/teacher/all", verifyUser, verifyUserType("TEACHER"), getTeacherAllRequests);
router.patch("/teacher/respond/:requestId", verifyUser, verifyUserType("TEACHER"), respondToRequest);

export default router;
