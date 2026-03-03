import { Router } from "express";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", async (req, res) => {
    // Handle login logic here
    // have to go to prisma and check
});

// GET /api/auth/me — returns the logged-in user's DB record (includes role)
router.get("/me", verifyUser, (req, res) => {
    return res.status(200).json({ user: req.user });
});

export default router;