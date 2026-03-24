import { apiClient } from './config';
import type {
  LegacyAssessment as Assessment,
  LegacyAssessmentListItem as AssessmentListItem,
  LegacyCreateAssessmentRequest as CreateAssessmentRequest,
  LegacyGetAssessmentsRequest as GetAssessmentsRequest,
  LegacyGetAssessmentsResponse as GetAssessmentsResponse,
  LegacyUpdateAssessmentRequest as UpdateAssessmentRequest,
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

    const response = await apiClient.get(
      `/api/courses/${courseId}/assessments`,
      { params }
    );

    const data: any = response.data;
    // tolerate either legacy wrapper or backend style
    const payload = (data?.data ?? data) as any;

    console.log(`✅ Retrieved ${payload?.assessments?.length ?? 0} assessments`);
    console.log('📊 Stats:', payload?.stats);
    return payload as GetAssessmentsResponse;
  }

  /**
   * Get a single assessment by ID with detailed information
   * Phase 4 (teacher portal): GET /api/courses/:courseId/assessments/:assessmentId
   */
  async getAssessmentById(courseId: string, assessmentId: string): Promise<any> {
    console.log('📖 Fetching assessment:', { courseId, assessmentId });

    const response = await apiClient.get(
      `/api/courses/${courseId}/assessments/${assessmentId}`
    );

    // Backend returns { message, assessment, submitted, late, not_submitted } for teachers
    // or { message, assessment, submission } for students.
    return response.data;
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
    
    const response = await apiClient.post(
      `/api/courses/${courseId}/assessments`,
      data
    );

    const payload: any = response.data?.data ?? response.data;
    console.log('✅ Assessment created successfully:', payload?._id ?? payload?.id);
    return payload as AssessmentListItem;
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
    
    const response = await apiClient.patch(
      `/api/assessments/${assessmentId}`,
      data
    );

    const payload: any = response.data?.data ?? response.data;
    console.log('✅ Assessment updated successfully');
    return payload as Assessment;
  }

  /**
   * Delete an assessment (soft delete)
   * @param assessmentId - The assessment ID
   */
  async deleteAssessment(assessmentId: string): Promise<void> {
    console.log('🗑️ Deleting assessment:', assessmentId);
    
    await apiClient.delete(`/api/assessments/${assessmentId}`);
    
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
