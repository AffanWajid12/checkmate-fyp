import prisma from "../config/prismaClient.js";
import { handleError, verifyCourseOwner, verifyStudentEnrolled } from "../utils/courseHelpers.js";

// POST /api/courses/:courseId/announcements
export const addAnnouncement = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description } = req.body;

        if (!title || !description)
            return res.status(400).json({ message: "Title and description are required" });

        await verifyCourseOwner(courseId, req.user.id);

        const announcement = await prisma.announcements.create({
            data: {
                title,
                description,
                course_id: courseId,
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
                    include: { user: { select: { id: true, name: true, role: true } } },
                    orderBy: { createdAt: "asc" }
                },
                assessments: {
                    include: { source_materials: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({ message: "Announcements retrieved successfully", announcements });
    } catch (error) {
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
                user: { select: { id: true, name: true, role: true } },
            },
        });

        return res.status(201).json({ message: "Comment added successfully", comment });
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
