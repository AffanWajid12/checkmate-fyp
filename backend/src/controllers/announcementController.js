import prisma from "../config/prismaClient.js";
import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
import { handleError, verifyCourseOwner, verifyStudentEnrolled, generateSignedUrl, signUserAvatar } from "../utils/courseHelpers.js";

// POST /api/courses/:courseId/announcements
export const addAnnouncement = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description } = req.body;

        if (!title || !description)
            return res.status(400).json({ message: "Title and description are required" });

        await verifyCourseOwner(courseId, req.user.id);

        // Upload any resource files to Supabase Storage
        const uploadedResources = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const ext = file.originalname.split(".").pop();
                const storagePath = `${courseId}/announcements/${uuidv4()}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from("source-materials")
                    .upload(storagePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false,
                    });

                if (uploadError)
                    throw { status: 500, message: `File upload failed: ${uploadError.message}` };

                uploadedResources.push({
                    bucket_path: storagePath,
                    file_name: file.originalname,
                    file_size: file.size,
                    mime_type: file.mimetype,
                });
            }
        }

        const announcement = await prisma.announcements.create({
            data: {
                title,
                description,
                course_id: courseId,
                resources: {
                    create: uploadedResources,
                },
            },
            include: {
                resources: true,
            },
        });

        return res.status(201).json({ message: "Announcement created successfully", announcement });
    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/courses/:courseId/announcements  (shared — teacher + student)
export const getCourseAnnouncements = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Allow access if teacher owns the course OR student is enrolled
        if (req.user.role === "TEACHER") {
            await verifyCourseOwner(courseId, req.user.id);
        } else {
            await verifyStudentEnrolled(courseId, req.user.id);
        }        
        
        const announcements = await prisma.announcements.findMany({
            where: { course_id: courseId },
            include: {
                comments: {
                    include: { user: { select: { id: true, name: true, role: true, profile_picture: true } } },
                    orderBy: { createdAt: "asc" }
                },
                resources: true,
                assessments: {
                    include: { source_materials: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Generate signed URLs for resources and comments
        const announcementsWithUrls = await Promise.all(
            announcements.map(async (ann) => {
                const resources = await Promise.all(
                    (ann.resources || []).map(async (res) => ({
                        ...res,
                        signed_url: await generateSignedUrl("source-materials", res.bucket_path),
                    }))
                );

                const comments = await Promise.all(
                    (ann.comments || []).map(async (comment) => ({
                        ...comment,
                        user: await signUserAvatar(comment.user),
                    }))
                );

                return { ...ann, resources, comments };
            })
        );

        console.log(`Successfully processed ${announcementsWithUrls.length} announcements`);
        return res.status(200).json({ message: "Announcements retrieved successfully", announcements: announcementsWithUrls });
    } catch (error) {
        console.error("CRITICAL ERROR in getCourseAnnouncements:", error);
        return handleError(res, error);
    }
};

// POST /api/courses/:courseId/announcements/:announcementId/comments
export const addAnnouncementComment = async (req, res) => {
    try {
        const { courseId, announcementId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim())
            return res.status(400).json({ message: "Comment content is required" });

        // Verify user has access to course
        if (req.user.role === "TEACHER") {
            await verifyCourseOwner(courseId, req.user.id);
        } else {
            await verifyStudentEnrolled(courseId, req.user.id);
        }

        const announcement = await prisma.announcements.findUnique({
            where: { id: announcementId },
        });

        if (!announcement || announcement.course_id !== courseId)
            return res.status(404).json({ message: "Announcement not found in this course" });

        const comment = await prisma.announcement_comments.create({
            data: {
                content: content.trim(),
                announcement_id: announcementId,
                user_id: req.user.id,
            },
            include: {
                user: { select: { id: true, name: true, role: true, profile_picture: true } },
            },
        });

        const signedUser = await signUserAvatar(comment.user);
        console.log('Created comment user data:', signedUser);
        return res.status(201).json({ message: "Comment added successfully", comment: { ...comment, user: signedUser } });
    } catch (error) {
        return handleError(res, error);
    }
};

// DELETE /api/courses/:courseId/announcements/:announcementId/comments/:commentId
export const deleteAnnouncementComment = async (req, res) => {
    try {
        const { courseId, announcementId, commentId } = req.params;

        if (req.user.role === "TEACHER") {
            await verifyCourseOwner(courseId, req.user.id);
        } else {
            await verifyStudentEnrolled(courseId, req.user.id);
        }

        const comment = await prisma.announcement_comments.findUnique({
            where: { id: commentId },
            include: { announcement: true },
        });

        if (!comment || comment.announcement_id !== announcementId || comment.announcement.course_id !== courseId)
            return res.status(404).json({ message: "Comment not found" });

        // Only the comment author or the course teacher can delete
        if (req.user.role !== "TEACHER" && comment.user_id !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own comments" });
        }

        await prisma.announcement_comments.delete({
            where: { id: commentId },
        });

        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        return handleError(res, error);
    }
};

// DELETE /api/courses/:courseId/announcements/:announcementId
export const deleteAnnouncement = async (req, res) => {
    try {
        const { courseId, announcementId } = req.params;

        await verifyCourseOwner(courseId, req.user.id);

        const announcement = await prisma.announcements.findUnique({
            where: { id: announcementId },
            include: {
                resources: true,
                assessments: {
                    include: {
                        source_materials: true,
                        submissions: {
                            include: { attachments: true }
                        }
                    }
                }
            }
        });

        if (!announcement || announcement.course_id !== courseId)
            return res.status(404).json({ message: "Announcement not found" });

        // Collect all storage paths to cleanup
        const resourcePaths = (announcement.resources || []).map(r => r.bucket_path);
        
        const materialPaths = [];
        const attachmentPaths = [];

        (announcement.assessments || []).forEach(asmt => {
            (asmt.source_materials || []).forEach(m => materialPaths.push(m.bucket_path));
            (asmt.submissions || []).forEach(s => {
                (s.attachments || []).forEach(att => attachmentPaths.push(att.bucket_path));
            });
        });

        // Cleanup Supabase Storage
        if (resourcePaths.length > 0) {
            await supabase.storage.from("source-materials").remove(resourcePaths);
        }
        if (materialPaths.length > 0) {
            await supabase.storage.from("source-materials").remove(materialPaths);
        }
        if (attachmentPaths.length > 0) {
            await supabase.storage.from("submission-files").remove(attachmentPaths);
        }

        // Delete from Prisma (CASCADE handles all related DB records)
        await prisma.announcements.delete({
            where: { id: announcementId }
        });

        return res.status(200).json({ message: "Announcement and related data deleted successfully" });
    } catch (error) {
        return handleError(res, error);
    }
};
// PATCH /api/courses/:courseId/announcements/:announcementId
export const updateAnnouncement = async (req, res) => {
    try {
        const { courseId, announcementId } = req.params;
        const { title, description } = req.body;

        await verifyCourseOwner(courseId, req.user.id);

        const announcement = await prisma.announcements.findUnique({
            where: { id: announcementId },
        });

        if (!announcement || announcement.course_id !== courseId)
            return res.status(404).json({ message: "Announcement not found" });

        // Handle new file uploads
        const newResources = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const ext = file.originalname.split(".").pop();
                const storagePath = `${courseId}/announcements/${uuidv4()}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from("source-materials")
                    .upload(storagePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false,
                    });

                if (uploadError)
                    throw { status: 500, message: `File upload failed: ${uploadError.message}` };

                newResources.push({
                    bucket_path: storagePath,
                    file_name: file.originalname,
                    file_size: file.size,
                    mime_type: file.mimetype,
                });
            }
        }

        const updated = await prisma.announcements.update({
            where: { id: announcementId },
            data: {
                title: title ?? announcement.title,
                description: description ?? announcement.description,
                resources: {
                    create: newResources,
                },
            },
            include: {
                resources: true,
            },
        });

        return res.status(200).json({ message: "Announcement updated successfully", announcement: updated });
    } catch (error) {
        return handleError(res, error);
    }
};
