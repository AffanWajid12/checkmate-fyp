import { Router } from "express";
import supabase from "../config/supabaseClient.js"

import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js"
import { getUsers, addUser, updateUserRole, deleteUser } from "../controllers/adminController.js"

const router = Router();

router.get("/users", verifyUser, verifyUserType("ADMIN"), getUsers);
router.post("/users", verifyUser, verifyUserType("ADMIN"), addUser);
router.patch("/users/:id/role", verifyUser, verifyUserType("ADMIN"), updateUserRole);
router.delete("/users/:id", verifyUser, verifyUserType("ADMIN"), deleteUser);

export default router;