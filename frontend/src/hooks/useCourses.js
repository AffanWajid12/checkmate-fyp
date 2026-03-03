import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/apiClient.js";

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const courseKeys = {
    enrolledCourses: ["courses", "enrolled"],
    teacherCourses:  ["courses", "teacher"],
    announcements:   (courseId) => ["courses", courseId, "announcements"],
    studentAttendance: (courseId) => ["courses", courseId, "attendance", "mine"],
    courseAttendance:  (courseId) => ["courses", courseId, "attendance"],
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
    });

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
        mutationFn: async ({ title, description }) => {
            const { data } = await apiClient.post(`/api/courses/${courseId}/announcements`, {
                title,
                description,
            });
            return data.announcement;
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
        mutationFn: async ({ date, records }) => {
            const { data } = await apiClient.post(`/api/courses/${courseId}/attendance`, {
                date,
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
 * GET /api/courses/:courseId/attendance
 * Returns all attendance records for a course (all students, all dates).
 * Each record includes enrollment.student for the student's name.
 */
export const useCourseAttendance = (courseId) =>
    useQuery({
        queryKey: courseKeys.courseAttendance(courseId),
        queryFn: async () => {
            const { data } = await apiClient.get(`/api/courses/${courseId}/attendance`);
            return data.records; // array of { id, date, status, enrollment: { student: { name, email } } }
        },
        enabled: !!courseId,
    });
