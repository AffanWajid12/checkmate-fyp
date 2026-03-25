import { apiClient } from "./config";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export type AttendanceRecordUpsert = {
  student_id: string;
  status: AttendanceStatus;
};

export type MarkAttendanceRequest = {
  sessionId?: string | null;
  date: string; // YYYY-MM-DD
  title?: string;
  records: AttendanceRecordUpsert[];
};

export type AttendanceSessionRecord = {
  id: string;
  status: AttendanceStatus;
  // Backend (per frontend usage) nests enrollment with student_id
  enrollment?: {
    student_id: string;
  };
};

export type AttendanceSession = {
  id: string;
  title?: string | null;
  date: string;
  records?: AttendanceSessionRecord[];
};

/**
 * Attendance Service (backend-aligned)
 * Reference: frontend/src/hooks/useCourses.js
 */
class AttendanceService {
  /**
   * Teacher: POST /api/courses/:courseId/attendance
   * Body: { sessionId?, date, title?, records: [{ student_id, status }] }
   * Returns: { message, sessionId, results }
   */
  async markAttendance(courseId: string, payload: MarkAttendanceRequest): Promise<any> {
    const { data } = await apiClient.post(`/api/courses/${courseId}/attendance`, payload);
    return data?.results;
  }

  /**
   * Teacher: GET /api/courses/:courseId/attendance
   * Returns: { message, sessions }
   */
  async getCourseAttendance(courseId: string): Promise<AttendanceSession[]> {
    const { data } = await apiClient.get(`/api/courses/${courseId}/attendance`);
    return (data?.sessions ?? []) as AttendanceSession[];
  }

  /**
   * Teacher: DELETE /api/courses/:courseId/attendance/:sessionId
   */
  async deleteAttendanceSession(courseId: string, sessionId: string): Promise<void> {
    await apiClient.delete(`/api/courses/${courseId}/attendance/${sessionId}`);
  }
}

export const attendanceService = new AttendanceService();
