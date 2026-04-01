import { Router } from "express";
import { verifyUser, verifyUserType } from "../middleware/authMiddleware.js";
import { uploadMultiple, uploadMultipleLarge } from "../middleware/uploadMiddleware.js";

import {
    createCourse,
    getTeacherCourses,
    enrollInCourse,
    getEnrolledCourses,
    deleteCourse,
    unenrollFromCourse,
} from "../controllers/courseController.js";

import {
    addAnnouncement,
    getCourseAnnouncements,
    addAnnouncementComment,
    deleteAnnouncementComment,
    updateAnnouncement,
    deleteAnnouncement,
} from "../controllers/announcementController.js";

import {
    markAttendance,
    getCourseAttendance,
    getStudentAttendance,
    deleteAttendanceSession,
} from "../controllers/attendanceController.js";

import {
    addAssessment,
    createAssessment,
    updateAssessment,
    addAssessmentSourceMaterials,
    getAssessmentDetails,
    submitAssessment,
    updateSubmission,
    unsubmitAssessment,
    removeAttachment,
    gradeSubmission,
    getSubmissionDetails,
    deleteSourceMaterial,
    teacherCreateSubmission,
    teacherAppendSubmissionFiles,
    deleteAssessment,
} from "../controllers/assessmentController.js";

import { runPlagiarismCheck } from "../controllers/plagiarismController.js";
import { extractQuestions, pairStudentAnswers } from "../controllers/gradingController.js";

const router = Router();

// ─── Student Routes ───────────────────────────────────────────────────────────
router.post("/enroll", verifyUser, verifyUserType("STUDENT"), enrollInCourse);
router.get("/enrolled", verifyUser, verifyUserType("STUDENT"), getEnrolledCourses);
router.delete("/unenroll/:courseId", verifyUser, verifyUserType("STUDENT"), unenrollFromCourse);

// ─── Teacher Routes ───────────────────────────────────────────────────────────
router.post("/", verifyUser, verifyUserType("TEACHER"), createCourse);
router.get("/my-courses", verifyUser, verifyUserType("TEACHER"), getTeacherCourses);
router.delete("/:id", verifyUser, verifyUserType("TEACHER"), deleteCourse);

// Announcements
router.post("/:courseId/announcements", verifyUser, verifyUserType("TEACHER"), uploadMultiple, addAnnouncement);
router.patch("/:courseId/announcements/:announcementId", verifyUser, verifyUserType("TEACHER"), uploadMultiple, updateAnnouncement);
router.delete("/:courseId/announcements/:announcementId", verifyUser, verifyUserType("TEACHER"), deleteAnnouncement);

// Attendance
router.post("/:courseId/attendance", verifyUser, verifyUserType("TEACHER"), markAttendance);
router.get("/:courseId/attendance", verifyUser, verifyUserType("TEACHER"), getCourseAttendance);
router.delete("/:courseId/attendance/:sessionId", verifyUser, verifyUserType("TEACHER"), deleteAttendanceSession);

// Assessment management (teacher)
router.post("/:courseId/assessments", verifyUser, verifyUserType("TEACHER"), uploadMultiple, createAssessment);
router.post("/:courseId/announcements/:announcementId/assessments", verifyUser, verifyUserType("TEACHER"), uploadMultiple, addAssessment);
router.patch("/:courseId/assessments/:assessmentId", verifyUser, verifyUserType("TEACHER"), updateAssessment);
router.delete("/:courseId/assessments/:assessmentId", verifyUser, verifyUserType("TEACHER"), deleteAssessment);
router.post(
    "/:courseId/assessments/:assessmentId/source-materials",
    verifyUser,
    verifyUserType("TEACHER"),
    uploadMultiple,
    addAssessmentSourceMaterials
);
router.post("/:courseId/assessments/:assessmentId/submissions", verifyUser, verifyUserType("TEACHER"), uploadMultipleLarge, teacherCreateSubmission);
router.patch("/:courseId/assessments/:assessmentId/submissions/:submissionId", verifyUser, verifyUserType("TEACHER"), uploadMultipleLarge, teacherAppendSubmissionFiles);
router.get("/:courseId/assessments/:assessmentId/submissions/:submissionId", verifyUser, verifyUserType("TEACHER"), getSubmissionDetails);
router.patch("/:courseId/assessments/:assessmentId/submissions/:submissionId/grade", verifyUser, verifyUserType("TEACHER"), gradeSubmission);
router.delete("/:courseId/assessments/:assessmentId/source-materials/:materialId", verifyUser, verifyUserType("TEACHER"), deleteSourceMaterial);
router.post("/:courseId/assessments/:assessmentId/plagiarism-check", verifyUser, verifyUserType("TEACHER"), runPlagiarismCheck);
router.post("/:courseId/assessments/:assessmentId/extract-questions", verifyUser, verifyUserType("TEACHER"), extractQuestions);
router.post("/:courseId/assessments/:assessmentId/submissions/:submissionId/pair-answers", verifyUser, verifyUserType("TEACHER"), pairStudentAnswers);

// Attendance (student)
router.get("/:courseId/my-attendance", verifyUser, verifyUserType("STUDENT"), getStudentAttendance);

// Assessment submissions (student) — includes Turn In, Add Files, Unsubmit, Remove File
router.post("/:courseId/assessments/:assessmentId/submit", verifyUser, verifyUserType("STUDENT"), uploadMultipleLarge, submitAssessment);
router.patch("/:courseId/assessments/:assessmentId/submit", verifyUser, verifyUserType("STUDENT"), uploadMultipleLarge, updateSubmission);
router.delete("/:courseId/assessments/:assessmentId/submit", verifyUser, verifyUserType("STUDENT"), unsubmitAssessment);
router.delete("/:courseId/assessments/:assessmentId/attachments/:attachmentId", verifyUser, verifyUserType("STUDENT"), removeAttachment);

// ─── Shared Routes (Teacher + Student) ───────────────────────────────────────
// getCourseAnnouncements and getAssessmentDetails handle role checking internally
router.get("/:courseId/announcements", verifyUser, getCourseAnnouncements);
router.get("/:courseId/assessments/:assessmentId", verifyUser, getAssessmentDetails);

// Comments
router.post("/:courseId/announcements/:announcementId/comments", verifyUser, addAnnouncementComment);
router.delete("/:courseId/announcements/:announcementId/comments/:commentId", verifyUser, deleteAnnouncementComment);

export default router;
