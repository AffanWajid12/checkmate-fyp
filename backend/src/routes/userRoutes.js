import { Router } from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js";
import {
    updateProfilePicture,
    updateProfile,
    changePassword
} from "../controllers/userController.js";

const router = Router();

// All routes here require authentication
router.use(verifyUser);

// POST /api/users/profile-picture
router.post("/profile-picture", uploadSingle, updateProfilePicture);

// PATCH /api/users/profile
router.patch("/profile", updateProfile);

// PATCH /api/users/change-password
router.patch("/change-password", changePassword);

export default router;
