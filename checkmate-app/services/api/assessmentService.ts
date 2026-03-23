import { apiClient } from './config';
import type {
    ApiResponse,
    Assessment,
    AssessmentListItem,
    CreateAssessmentRequest,
    GetAssessmentsRequest,
    GetAssessmentsResponse,
    UpdateAssessmentRequest,
} from './types';

/**
 * Assessment Management Service
 * Handles all assessment-related API operations
 */
class AssessmentService {
  /**
   * Get all assessments for a specific course
   * @param courseId - The course ID
   * @param params - Query parameters for filtering and sorting
   */
  async getAssessmentsByCourse(
    courseId: string,
    params?: GetAssessmentsRequest
  ): Promise<GetAssessmentsResponse> {
    console.log('📋 Fetching assessments for course:', courseId, params);
    
    const response = await apiClient.get<ApiResponse<GetAssessmentsResponse>>(
      `/api/courses/${courseId}/assessments`,
      { params }
    );
    
    console.log(`✅ Retrieved ${response.data.data.assessments.length} assessments`);
    console.log('📊 Stats:', response.data.data.stats);
    return response.data.data;
  }

  /**
   * Get a single assessment by ID with detailed information
   * @param assessmentId - The assessment ID
   */
  async getAssessmentById(assessmentId: string): Promise<Assessment> {
    console.log('📖 Fetching assessment:', assessmentId);
    
    const response = await apiClient.get<ApiResponse<Assessment>>(
      `/api/assessments/${assessmentId}`
    );
    
    console.log('✅ Assessment retrieved:', response.data.data.title);
    console.log('📊 Submission stats:', response.data.data.submissionStats);
    return response.data.data;
  }

  /**
   * Create a new assessment for a course
   * @param courseId - The course ID
   * @param data - Assessment creation data
   */
  async createAssessment(
    courseId: string,
    data: CreateAssessmentRequest
  ): Promise<AssessmentListItem> {
    console.log('➕ Creating assessment:', data.title, data.type);
    console.log('📅 Due date:', data.dueDate);
    
    const response = await apiClient.post<ApiResponse<AssessmentListItem>>(
      `/api/courses/${courseId}/assessments`,
      data
    );
    
    console.log('✅ Assessment created successfully:', response.data.data._id);
    return response.data.data;
  }

  /**
   * Update an existing assessment
   * @param assessmentId - The assessment ID
   * @param data - Fields to update
   */
  async updateAssessment(
    assessmentId: string,
    data: UpdateAssessmentRequest
  ): Promise<Assessment> {
    console.log('📝 Updating assessment:', assessmentId);
    
    const response = await apiClient.patch<ApiResponse<Assessment>>(
      `/api/assessments/${assessmentId}`,
      data
    );
    
    console.log('✅ Assessment updated successfully');
    return response.data.data;
  }

  /**
   * Delete an assessment (soft delete)
   * @param assessmentId - The assessment ID
   */
  async deleteAssessment(assessmentId: string): Promise<void> {
    console.log('🗑️ Deleting assessment:', assessmentId);
    
    await apiClient.delete<ApiResponse<null>>(`/api/assessments/${assessmentId}`);
    
    console.log('✅ Assessment deleted successfully');
  }

  /**
   * Get assessments filtered by status
   * @param courseId - The course ID
   * @param status - Filter by status
   */
  async getAssessmentsByStatus(
    courseId: string,
    status: 'upcoming' | 'active' | 'graded'
  ): Promise<GetAssessmentsResponse> {
    console.log(`🔍 Fetching ${status} assessments for course:`, courseId);
    
    return this.getAssessmentsByCourse(courseId, { status });
  }

  /**
   * Get assessments filtered by type
   * @param courseId - The course ID
   * @param type - Filter by type
   */
  async getAssessmentsByType(
    courseId: string,
    type: 'exam' | 'quiz' | 'homework' | 'project' | 'assignment'
  ): Promise<GetAssessmentsResponse> {
    console.log(`🔍 Fetching ${type} assessments for course:`, courseId);
    
    return this.getAssessmentsByCourse(courseId, { type });
  }

  /**
   * Get upcoming assessments sorted by due date
   * @param courseId - The course ID
   */
  async getUpcomingAssessments(courseId: string): Promise<AssessmentListItem[]> {
    console.log('📅 Fetching upcoming assessments:', courseId);
    
    const response = await this.getAssessmentsByCourse(courseId, {
      status: 'upcoming',
      sortBy: 'dueDate',
      order: 'asc',
    });
    
    return response.assessments;
  }

  /**
   * Get active assessments (assessments with submissions)
   * @param courseId - The course ID
   */
  async getActiveAssessments(courseId: string): Promise<AssessmentListItem[]> {
    console.log('⚡ Fetching active assessments:', courseId);
    
    const response = await this.getAssessmentsByCourse(courseId, {
      status: 'active',
      sortBy: 'dueDate',
      order: 'asc',
    });
    
    return response.assessments;
  }

  /**
   * Get graded assessments (past due date)
   * @param courseId - The course ID
   */
  async getGradedAssessments(courseId: string): Promise<AssessmentListItem[]> {
    console.log('✅ Fetching graded assessments:', courseId);
    
    const response = await this.getAssessmentsByCourse(courseId, {
      status: 'graded',
      sortBy: 'dueDate',
      order: 'desc',
    });
    
    return response.assessments;
  }

  /**
   * Calculate time remaining until due date
   * @param dueDate - ISO date string
   */
  getTimeRemaining(dueDate: string): {
    isPastDue: boolean;
    days: number;
    hours: number;
    minutes: number;
    formatted: string;
  } {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const isPastDue = diffMs < 0;
    
    const absDiffMs = Math.abs(diffMs);
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let formatted = '';
    if (isPastDue) {
      formatted = 'Past due';
    } else if (days > 0) {
      formatted = `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m remaining`;
    } else {
      formatted = `${minutes}m remaining`;
    }
    
    return { isPastDue, days, hours, minutes, formatted };
  }

  /**
   * Format due date for display
   * @param dueDate - ISO date string
   */
  formatDueDate(dueDate: string): string {
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

export const assessmentService = new AssessmentService();
