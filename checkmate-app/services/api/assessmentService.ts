import { apiClient } from './config';
import type { BackendAssessmentType } from './types';

export type CreateAssessmentInput = {
  title: string;
  type: BackendAssessmentType;
  instructions: string; // always send a string (can be empty)
  visibleToStudents?: boolean;
  due_date?: string; // ISO string
  files?: Array<{
    fileName: string;
    fileUrl: string;
    mimeType?: string;
  }>;
};

class AssessmentService {
  /**
   * Create a new assessment for a course
   * POST /api/courses/:courseId/assessments (multipart)
   * fields: title, type, instructions, due_date
   * files: files[] (optional)
   */
  async createAssessment(courseId: string, data: CreateAssessmentInput): Promise<any> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('type', data.type);
    formData.append('instructions', (data.instructions ?? '').toString());

    if (data.visibleToStudents !== undefined) {
      formData.append('visibleToStudents', String(data.visibleToStudents));
    }

    if (data.due_date) {
      formData.append('due_date', new Date(data.due_date).toISOString());
    }

    if (data.files?.length) {
      for (const f of data.files) {
        formData.append('files', {
          uri: f.fileUrl,
          name: f.fileName,
          type: f.mimeType ?? 'application/octet-stream',
        } as any);
      }
    }

    const response = await apiClient.post(
      `/api/courses/${courseId}/assessments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return response.data;
  }

  /**
   * Get a single assessment by ID with detailed information
   * GET /api/courses/:courseId/assessments/:assessmentId
   */
  async getAssessmentById(courseId: string, assessmentId: string): Promise<any> {
    const response = await apiClient.get(
      `/api/courses/${courseId}/assessments/${assessmentId}`
    );
    return response.data;
  }

  // NOTE: Legacy list/update/delete helpers removed per request.
}

export const assessmentService = new AssessmentService();
export const AssessmentServiceInstance = assessmentService;
