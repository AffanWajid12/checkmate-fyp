import prisma from "../config/prismaClient.js";
import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
import { handleError, generateSignedUrl } from "../utils/courseHelpers.js";

// POST /api/users/profile-picture
export const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const userId = req.user.id;
        const file = req.file;
        const ext = file.originalname.split(".").pop();
        const storagePath = `profile-pictures/${userId}/${uuidv4()}.${ext}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("profiles") // Make sure this bucket exists
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (uploadError) {
            throw { status: 500, message: `File upload failed: ${uploadError.message}` };
        }

        // Update user record in Prisma
        const user = await prisma.users.update({
            where: { id: userId },
            data: { profile_picture: storagePath },
        });

        // Generate signed URL for immediate feedback
        const signedUrl = await generateSignedUrl("profiles", storagePath);

        return res.status(200).json({
            message: "Profile picture updated successfully",
            profile_picture: storagePath,
            signedUrl
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// PATCH /api/users/profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }

        const user = await prisma.users.update({
            where: { id: userId },
            data: { name },
        });

        return res.status(200).json({ message: "Profile updated successfully", user });
    } catch (error) {
        return handleError(res, error);
    }
};

// PATCH /api/users/change-password
export const changePassword = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        // Update password in Supabase Auth
        // Note: The user is already authenticated, so we can use update breakout
        const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
            password: password
        });

        if (error) {
            throw { status: 400, message: `Password update failed: ${error.message}` };
        }

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        return handleError(res, error);
    }
};
