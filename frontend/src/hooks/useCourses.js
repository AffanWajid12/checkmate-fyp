import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/apiClient.js";

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const courseKeys = {
    enrolledCourses:   ["courses", "enrolled"],
    teacherCourses:    ["courses", "teacher"],
    announcements:     (courseId) => ["courses", courseId, "announcements"],
    studentAttendance: (courseId) => ["courses", courseId, "attendance", "mine"],
    courseAttendance:  (courseId) => ["courses", courseId, "attendance"],
    assessmentDetails: (courseId, assessmentId) => ["courses", courseId, "assessments", assessmentId],
    submissionDetails: (courseId, assessmentId, submissionId) => ["courses", courseId, "assessments", assessmentId, "submissions", submissionId],
};

// ─── Student Hooks ────────────────────────────────────────────────────────────

/**
 * GET /api/courses/enrolled
 * Returns all courses the logged-in student is enrolled in.
 */
export const useEnrolledCourses = () =>
    useQuery({
        queryKey: courseKeys.enrolledCourses,
        queryFn: async () => {
            const { data } = await apiClient.get("/api/courses/enrolled");
            return data.courses; // array of course objects (each includes teacher)
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

/**
 * POST /api/courses/enroll
 * Body: { code: string }
 * Enrolls the student in a course by its code.
 */
export const useEnrollInCourse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ code }) => {
            const { data } = await apiClient.post("/api/courses/enroll", { code });
            return data.enrollment;
        },
        onSuccess: () => {
            // Refresh the enrolled courses list so the new card appears immediately
            queryClient.invalidateQueries({ queryKey: courseKeys.enrolledCourses });
        },
    });
};

/**
 * GET /api/courses/:courseId/my-attendance
 * Returns the student's own attendance records for a specific course.
 */
export const useStudentAttendance = (courseId) =>
    useQuery({
        queryKey: courseKeys.studentAttendance(courseId),
        queryFn: async () => {
            const { data } = await apiClient.get(`/api/courses/${courseId}/my-attendance`);
            return data.records; // array of { id, date, status, enrollment_id, ... }
        },
        enabled: !!courseId,
    });

/**
 * GET /api/courses/:courseId/announcements
 * Returns announcements for a course. Accessible by both TEACHER (owns) and STUDENT (enrolled).
 */
export const useCourseAnnouncements = (courseId) =>
    useQuery({
        queryKey: courseKeys.announcements(courseId),
        queryFn: async () => {
            const { data } = await apiClient.get(`/api/courses/${courseId}/announcements`);
            return data.announcements; // array of { id, title, description, createdAt, assessments[] }
        },
        enabled: !!courseId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

/**
 * DELETE /api/courses/:id
 * Permanent deletion of a course by teacher.
 */
export const useDeleteCourse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (courseId) => {
            const { data } = await apiClient.delete(`/api/courses/${courseId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.teacherCourses });
        },
    });
};

/**
 * DELETE /api/courses/unenroll/:courseId
 * Unenroll from a course (STUDENT).
 */
export const useUnenrollCourse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (courseId) => {
            const { data } = await apiClient.delete(`/api/courses/unenroll/${courseId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.enrolledCourses });
        },
    });
};

// ─── Teacher Hooks ────────────────────────────────────────────────────────────

/**
 * GET /api/courses/my-courses
 * Returns all courses owned by the logged-in teacher (includes students[] and announcements[]).
 */
export const useTeacherCourses = () =>
    useQuery({
        queryKey: courseKeys.teacherCourses,
        queryFn: async () => {
            const { data } = await apiClient.get("/api/courses/my-courses");
            return data.courses; // array of course objects (each includes students[] and announcements[])
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

/**
 * POST /api/courses
 * Body: { title: string, description?: string }
 * Creates a new course. The auto-generated code is in the response.
 */
export const useCreateCourse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ title, description }) => {
            const { data } = await apiClient.post("/api/courses", { title, description });
            return data.course; // includes auto-generated code
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.teacherCourses });
        },
    });
};

/**
 * POST /api/courses/:courseId/announcements
 * Body: { title: string, description: string }
 * Adds a new announcement to a course.
 */
export const useAddAnnouncement = (courseId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ formData }) => {
            const { data } = await apiClient.post(`/api/courses/${courseId}/announcements`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data.announcement;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.announcements(courseId) });
        },
    });
};

/**
 * POST /api/courses/:courseId/announcements/:announcementId/comments
 * Body: { content: string }
 * Adds a comment to a specific announcement.
 */
export const useAddAnnouncementComment = (courseId, announcementId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ content }) => {
            const { data } = await apiClient.post(
                `/api/courses/${courseId}/announcements/${announcementId}/comments`,
                { content }
            );
            return data.comment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.announcements(courseId) });
        },
    });
};

/**
 * DELETE /api/courses/:courseId/announcements/:announcementId/comments/:commentId
 * Deletes a comment from an announcement.
 */
export const useDeleteAnnouncementComment = (courseId, announcementId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ commentId }) => {
            const { data } = await apiClient.delete(
                `/api/courses/${courseId}/announcements/${announcementId}/comments/${commentId}`
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.announcements(courseId) });
        },
    });
};

/**
 * POST /api/courses/:courseId/attendance
 * Body: { date: "YYYY-MM-DD", records: [{ student_id, status }] }
 * Marks (or updates) attendance for a session. Uses upsert on the backend.
 */
export const useMarkAttendance = (courseId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ sessionId, date, title, records }) => {
            const { data } = await apiClient.post(`/api/courses/${courseId}/attendance`, {
                sessionId,
                date,
                title,
                records,
            });
            return data.results;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.courseAttendance(courseId) });
        },
    });
};

/**
 * DELETE /api/courses/:courseId/attendance/:sessionId
 * Deletes an entire attendance session and its records.
 */
export const useDeleteAttendanceSession = (courseId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (sessionId) => {
            const { data } = await apiClient.delete(`/api/courses/${courseId}/attendance/${sessionId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.courseAttendance(courseId) });
        },
    });
};

/**
 * GET /api/courses/:courseId/attendance
 * Returns all attendance records for a course (all students, all dates).
 * Each record includes enrollment.student for the student's name.
 */
export const useCourseAttendance = (courseId) =>
    useQuery({
        queryKey: courseKeys.courseAttendance(courseId),
        queryFn: async () => {
            const { data } = await apiClient.get(`/api/courses/${courseId}/attendance`);
            return data.sessions; // array of { id, title, date, records: [...] }
        },
        enabled: !!courseId,
    });

// ─── Assessment Hooks ─────────────────────────────────────────────────────────

/**
 * POST /api/courses/:courseId/announcements/:announcementId/assessments
 * Body: multipart/form-data — title*, type*, instructions?, due_date?, files?
 * Creates an assessment linked to an announcement, with optional source material uploads.
 */
export const useAddAssessment = (courseId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ announcementId, formData }) => {
            const { data } = await apiClient.post(
                `/api/courses/${courseId}/announcements/${announcementId}/assessments`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return data; // { assessment, source_materials[] }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.announcements(courseId) });
        },
    });
};

/**
 * POST /api/courses/:courseId/assessments
 * Body: multipart/form-data — title*, type*, instructions?, due_date?, files?
 * Creates an assessment and auto-creates a linked announcement on the backend.
 */
export const useCreateAssessment = (courseId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ formData }) => {
            const { data } = await apiClient.post(
                `/api/courses/${courseId}/assessments`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return data; // { announcement, assessment, source_materials[], upload_errors? }
        },
        onSuccess: () => {
            // Assessment creation should reflect immediately in announcements + assessments views
            queryClient.invalidateQueries({ queryKey: courseKeys.announcements(courseId) });
        },
    });
};

/**
 * GET /api/courses/:courseId/assessments/:assessmentId
 * Role-aware: teacher gets submitted/late/not_submitted lists; student gets own submission.
 */
export const useAssessmentDetails = (courseId, assessmentId) =>
    useQuery({
        queryKey: courseKeys.assessmentDetails(courseId, assessmentId),
        queryFn: async () => {
            const { data } = await apiClient.get(
                `/api/courses/${courseId}/assessments/${assessmentId}`
            );
            return data; // { assessment, submitted[], late[], not_submitted[] } OR { assessment, submission }
        },
        enabled: !!courseId && !!assessmentId,
    });

/**
 * POST /api/courses/:courseId/assessments/:assessmentId/submit
 * Body: multipart/form-data — files* (at least one)
 * Creates the student's first submission.
 */
export const useSubmitAssessment = (courseId, assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData) => {
            const { data } = await apiClient.post(
                `/api/courses/${courseId}/assessments/${assessmentId}/submit`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return data; // { submission, attachments[] }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: courseKeys.assessmentDetails(courseId, assessmentId),
            });
        },
    });
};

/**
 * PATCH /api/courses/:courseId/assessments/:assessmentId/submit
 * Body: multipart/form-data — files* (at least one)
 * Appends more files to an existing submission (blocked if GRADED).
 */
export const useUpdateSubmission = (courseId, assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData) => {
            const { data } = await apiClient.patch(
                `/api/courses/${courseId}/assessments/${assessmentId}/submit`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return data; // { submission, new_attachments[] }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: courseKeys.assessmentDetails(courseId, assessmentId),
            });
        },
    });
};

/**
 * DELETE /api/courses/:courseId/assessments/:assessmentId/submit
 * Retracts the student's submission entirely (Google Classroom "Unsubmit").
 */
export const useUnsubmitAssessment = (courseId, assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.delete(
                `/api/courses/${courseId}/assessments/${assessmentId}/submit`
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: courseKeys.assessmentDetails(courseId, assessmentId),
            });
        },
    });
};

/**
 * DELETE /api/courses/:courseId/assessments/:assessmentId/attachments/:attachmentId
 * Removes a single file from the student's submission.
 */
export const useRemoveAttachment = (courseId, assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (attachmentId) => {
            const { data } = await apiClient.delete(
                `/api/courses/${courseId}/assessments/${assessmentId}/attachments/${attachmentId}`
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: courseKeys.assessmentDetails(courseId, assessmentId),
            });
        },
    });
};

/**
 * GET /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId
 * Teacher only — returns full submission with signed attachment URLs.
 */
export const useGetSubmissionDetails = (courseId, assessmentId, submissionId) =>
    useQuery({
        queryKey: courseKeys.submissionDetails(courseId, assessmentId, submissionId),
        queryFn: async () => {
            const { data } = await apiClient.get(
                `/api/courses/${courseId}/assessments/${assessmentId}/submissions/${submissionId}`
            );
            return data.submission; // { id, status, submitted_at, grade, feedback, user, attachments[] }
        },
        enabled: !!courseId && !!assessmentId && !!submissionId,
    });

/**
 * DELETE /api/courses/:courseId/assessments/:assessmentId/source-materials/:materialId
 * Teacher only — removes a source material from storage and DB.
 */
export const useDeleteSourceMaterial = (courseId, assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (materialId) => {
            const { data } = await apiClient.delete(
                `/api/courses/${courseId}/assessments/${assessmentId}/source-materials/${materialId}`
            );
            return data; // { message }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: courseKeys.assessmentDetails(courseId, assessmentId),
            });
        },
    });
};
