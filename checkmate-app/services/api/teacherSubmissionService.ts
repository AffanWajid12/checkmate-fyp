import { apiClient } from "./config";

export type TeacherCreateSubmissionFile = {
  uri: string;
  name: string;
  type?: string;
};

/**
 * Phase 6 (Option A): teacher-created submissions
 * POST /api/courses/:courseId/assessments/:assessmentId/submissions (multipart)
 * fields: student_id
 * files: files[]
 */
class TeacherSubmissionService {
  async createSubmissionForStudent(
    courseId: string,
    assessmentId: string,
    studentId: string,
    files: TeacherCreateSubmissionFile[]
  ): Promise<any> {
    const formData = new FormData();
    formData.append("student_id", studentId);

    for (const f of files) {
      formData.append(
        "files",
        {
          uri: f.uri,
          name: f.name,
          type: f.type ?? "application/octet-stream",
        } as any
      );
    }

    const response = await apiClient.post(
      `/api/courses/${courseId}/assessments/${assessmentId}/submissions`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  }

  async appendFilesToSubmission(
    courseId: string,
    assessmentId: string,
    submissionId: string,
    files: TeacherCreateSubmissionFile[]
  ): Promise<any> {
    const formData = new FormData();

    for (const f of files) {
      formData.append(
        "files",
        {
          uri: f.uri,
          name: f.name,
          type: f.type ?? "application/octet-stream",
        } as any
      );
    }

    const response = await apiClient.patch(
      `/api/courses/${courseId}/assessments/${assessmentId}/submissions/${submissionId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  }
}

export const teacherSubmissionService = new TeacherSubmissionService();
