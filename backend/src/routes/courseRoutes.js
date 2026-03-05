import { Router } from "express";
import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js";
import { uploadMultiple } from "../middleware/uploadMiddleware.js";
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
    addAssessment,
    getAssessmentDetails,
    submitAssessment,
    updateSubmission,
    gradeSubmission,
    getSubmissionDetails,
    deleteSourceMaterial,
} from "../controllers/courseController.js";

const router = Router();

// ─── Teacher Routes ───────────────────────────────────────────────────────────
router.post("/", verifyUser, verifyUserType("TEACHER"), createCourse);
router.get("/my-courses", verifyUser, verifyUserType("TEACHER"), getTeacherCourses);
router.post("/:courseId/announcements", verifyUser, verifyUserType("TEACHER"), addAnnouncement);
router.post("/:courseId/attendance", verifyUser, verifyUserType("TEACHER"), markAttendance);
router.get("/:courseId/attendance", verifyUser, verifyUserType("TEACHER"), getCourseAttendance);

// Assessment management (teacher)
router.post("/:courseId/announcements/:announcementId/assessments", verifyUser, verifyUserType("TEACHER"), uploadMultiple, addAssessment);
router.get("/:courseId/assessments/:assessmentId/submissions/:submissionId", verifyUser, verifyUserType("TEACHER"), getSubmissionDetails);
router.patch("/:courseId/assessments/:assessmentId/submissions/:submissionId/grade", verifyUser, verifyUserType("TEACHER"), gradeSubmission);
router.delete("/:courseId/assessments/:assessmentId/source-materials/:materialId", verifyUser, verifyUserType("TEACHER"), deleteSourceMaterial);

// ─── Student Routes ───────────────────────────────────────────────────────────
router.post("/enroll", verifyUser, verifyUserType("STUDENT"), enrollInCourse);
router.get("/enrolled", verifyUser, verifyUserType("STUDENT"), getEnrolledCourses);
router.get("/:courseId/my-attendance", verifyUser, verifyUserType("STUDENT"), getStudentAttendance);

// Assessment submissions (student)
router.post("/:courseId/assessments/:assessmentId/submit", verifyUser, verifyUserType("STUDENT"), uploadMultiple, submitAssessment);
router.patch("/:courseId/assessments/:assessmentId/submit", verifyUser, verifyUserType("STUDENT"), uploadMultiple, updateSubmission);

// ─── Shared Routes (Teacher + Student) ───────────────────────────────────────
// getCourseAnnouncements and getAssessmentDetails handle role checking internally
router.get("/:courseId/announcements", verifyUser, getCourseAnnouncements);
router.get("/:courseId/assessments/:assessmentId", verifyUser, getAssessmentDetails);

export default router;
