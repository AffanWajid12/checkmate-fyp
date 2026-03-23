import { AxiosError } from 'axios';
import { apiClient } from './config';
import { ApiError, ApiResponse } from './types';

/**
 * File interface for submission files
 */
export interface SubmissionFile {
  _id?: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt?: string;
}

/**
 * Student interface for submission
 */
export interface SubmissionStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentNumber: string;
  profileImage?: string | null;
}

/**
 * Submission interface
 */
export interface Submission {
  _id: string;
  assessment: string;
  student: SubmissionStudent | string;
  submittedAt: string;
  status: 'not-graded' | 'graded' | 'pending';
  grade?: number | null;
  feedback?: string | null;
  files: SubmissionFile[];
  isLate: boolean;
  penaltyApplied: number;
  gradedAt?: string | null;
  gradedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Submission statistics
 */
export interface SubmissionStats {
  total: number;
  graded: number;
  notGraded: number;
  pending: number;
  lateSubmissions: number;
}

/**
 * Response for getting all submissions
 */
export interface GetSubmissionsResponse {
  submissions: Submission[];
  stats: SubmissionStats;
}

/**
 * Request for creating a single submission
 */
export interface CreateSubmissionRequest {
  studentId: string;
  files: Omit<SubmissionFile, '_id' | 'uploadedAt'>[];
  notes?: string;
}

/**
 * Request for bulk creating submissions
 */
export interface BulkCreateSubmissionsRequest {
  submissions: CreateSubmissionRequest[];
}

/**
 * Response for bulk create
 */
export interface BulkCreateSubmissionsResponse {
  successCount: number;
  skippedCount: number;
  created: Submission[];
}

/**
 * Request for updating submission files
 */
export interface UpdateSubmissionRequest {
  files: Omit<SubmissionFile, '_id' | 'uploadedAt'>[];
  notes?: string;
}

/**
 * Request for grading a submission
 */
export interface GradeSubmissionRequest {
  grade: number;
  feedback?: string;
}

/**
 * Query parameters for getting submissions
 */
export interface GetSubmissionsParams {
  status?: 'not-graded' | 'graded' | 'pending';
  sortBy?: 'submittedAt' | 'grade' | 'status';
  order?: 'asc' | 'desc';
}

/**
 * Submission Service
 * Handles all submission-related API calls
 */
class SubmissionService {
  /**
   * Get all submissions for an assessment
   * @param assessmentId Assessment ID
   * @param params Query parameters
   * @returns Promise with submissions and stats
   */
  async getSubmissionsByAssessment(
    assessmentId: string,
    params?: GetSubmissionsParams
  ): Promise<GetSubmissionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.order) queryParams.append('order', params.order);

      const queryString = queryParams.toString();
      const url = `/api/assessments/${assessmentId}/submissions${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<ApiResponse<GetSubmissionsResponse>>(url);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get submission by ID
   * @param submissionId Submission ID
   * @returns Promise with submission details
   */
  async getSubmissionById(submissionId: string): Promise<Submission> {
    try {
      const response = await apiClient.get<ApiResponse<Submission>>(
        `/api/submissions/${submissionId}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a submission for a student
   * @param assessmentId Assessment ID
   * @param data Submission data
   * @returns Promise with created submission
   */
  async createSubmission(
    assessmentId: string,
    data: CreateSubmissionRequest
  ): Promise<Submission> {
    try {
      const response = await apiClient.post<ApiResponse<Submission>>(
        `/api/assessments/${assessmentId}/submissions`,
        data
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Bulk create submissions
   * @param assessmentId Assessment ID
   * @param data Bulk submission data
   * @returns Promise with bulk create response
   */
  async bulkCreateSubmissions(
    assessmentId: string,
    data: BulkCreateSubmissionsRequest
  ): Promise<BulkCreateSubmissionsResponse> {
    try {
      const response = await apiClient.post<ApiResponse<BulkCreateSubmissionsResponse>>(
        `/api/assessments/${assessmentId}/submissions/bulk`,
        data
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update submission files
   * @param submissionId Submission ID
   * @param data Update data
   * @returns Promise with updated submission
   */
  async updateSubmission(
    submissionId: string,
    data: UpdateSubmissionRequest
  ): Promise<Submission> {
    try {
      const response = await apiClient.patch<ApiResponse<Submission>>(
        `/api/submissions/${submissionId}`,
        data
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Grade a submission
   * @param submissionId Submission ID
   * @param data Grade data
   * @returns Promise with graded submission
   */
  async gradeSubmission(
    submissionId: string,
    data: GradeSubmissionRequest
  ): Promise<Submission> {
    try {
      const response = await apiClient.post<ApiResponse<Submission>>(
        `/api/submissions/${submissionId}/grade`,
        data
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a submission
   * @param submissionId Submission ID
   * @returns Promise with void
   */
  async deleteSubmission(submissionId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/submissions/${submissionId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param error Axios error
   * @returns Formatted error object
   */
  private handleError(error: unknown): Error {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;

      if (apiError?.message) {
        return new Error(apiError.message);
      }

      if (error.response?.status === 404) {
        return new Error('Submission or assessment not found');
      }

      if (error.response?.status === 403) {
        return new Error('You do not have permission to perform this action');
      }

      if (error.response?.status === 400) {
        return new Error('Invalid submission data. Please check your input.');
      }

      if (error.response?.status && error.response.status >= 500) {
        return new Error('Server error. Please try again later.');
      }

      if (error.code === 'ECONNABORTED') {
        return new Error('Request timeout. Please check your connection.');
      }

      if (error.code === 'ERR_NETWORK') {
        return new Error(
          'Network error. Please check your internet connection.'
        );
      }
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}

// Export singleton instance
export const submissionService = new SubmissionService();
