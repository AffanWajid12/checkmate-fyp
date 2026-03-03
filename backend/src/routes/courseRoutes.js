import { Router } from "express";
import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js";
import {
    createCourse,
    getTeacherCourses,
    addAnnouncement,
    markAttendance,
    getCourseAttendance,
    enrollInCourse,
    getEnrolledCourses,
    getStudentAttendance,
    getCourseAnnouncements,
} from "../controllers/courseController.js";

const router = Router();

// ─── Teacher Routes ───────────────────────────────────────────────────────────
router.post("/", verifyUser, verifyUserType("TEACHER"), createCourse);
router.get("/my-courses", verifyUser, verifyUserType("TEACHER"), getTeacherCourses);
router.post("/:courseId/announcements", verifyUser, verifyUserType("TEACHER"), addAnnouncement);
router.post("/:courseId/attendance", verifyUser, verifyUserType("TEACHER"), markAttendance);
router.get("/:courseId/attendance", verifyUser, verifyUserType("TEACHER"), getCourseAttendance);

// ─── Student Routes ───────────────────────────────────────────────────────────
router.post("/enroll", verifyUser, verifyUserType("STUDENT"), enrollInCourse);
router.get("/enrolled", verifyUser, verifyUserType("STUDENT"), getEnrolledCourses);
router.get("/:courseId/my-attendance", verifyUser, verifyUserType("STUDENT"), getStudentAttendance);

// ─── Shared Routes (Teacher + Student) ───────────────────────────────────────
// getCourseAnnouncements handles role checking internally
router.get("/:courseId/announcements", verifyUser, getCourseAnnouncements);

export default router;
