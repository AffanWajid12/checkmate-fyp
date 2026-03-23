import { apiClient } from './config';
import type { ApiResponse } from './types';

// Student-related types
export interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  enrolledAt?: string;
  submissionStats?: {
    submitted: number;
    total: number;
    avgGrade: number | null;
  };
  enrolledCourses?: Array<{
    _id: string;
    title: string;
    code: string;
    section: string;
    semester: string;
  }>;
}

export interface StudentDetailResponse {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  department?: string;
  enrolledCourses: Array<{
    _id: string;
    title: string;
    code: string;
    section: string;
    semester: string;
    year: number;
    enrolledAt: string;
    submissionStats: {
      submitted: number;
      total: number;
      avgGrade: number | null;
    };
  }>;
  overallStats: {
    totalCourses: number;
    totalSubmissions: number;
    totalAssessments: number;
    overallAverage: number | null;
  };
}

export interface GetStudentsParams {
  search?: string;
  sortBy?: 'firstName' | 'lastName' | 'studentNumber' | 'enrolledAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface GetStudentsResponse {
  students: Student[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalStudents: number;
    limit: number;
  };
}

export interface GetEnrolledStudentsParams {
  courseId: string;
  search?: string;
  sortBy?: 'firstName' | 'lastName' | 'studentNumber' | 'enrolledAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const studentService = {
  /**
   * Get enrolled students for a specific course
   */
  getEnrolledStudents: async (params: GetEnrolledStudentsParams): Promise<GetStudentsResponse> => {
  try {
    const { courseId, ...queryParams } = params;

    const response = await apiClient.get<ApiResponse<GetStudentsResponse>>(
      `/api/courses/${courseId}/students`,
      { params: queryParams } // axios will automatically convert this to query string
    );
    return response.data.data;
  } catch (error) {
    console.error(`❌ Error fetching enrolled students for course ${params.courseId}:`, error);
    throw error;
  }
},
  /**
   * Enroll a student in a course
   */
  enrollStudent: async (courseId: string, studentId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/courses/${courseId}/students`, { studentId });
    } catch (error) {
      console.error(`❌ Error enrolling student ${studentId} in course ${courseId}:`, error);
      throw error;
    }
  },
  /**
   * Bulk enroll students in a course
   */
  bulkEnrollStudents: async (courseId: string, studentIds: string[]): Promise<{
    successCount: number;
    failedCount: number;
    alreadyEnrolled: number;
    enrolled: string[];
  }> => {
    try {
      const response = await apiClient.post<ApiResponse<{
        successCount: number;
        failedCount: number;
        alreadyEnrolled: number;
        enrolled: string[];
      }>>(`/api/courses/${courseId}/students/bulk`, { studentIds });
      return response.data.data;
    } catch (error) {
      console.error(`❌ Error bulk enrolling students in course ${courseId}:`, error);
      throw error;
    }
  },
  /**
   * Remove a student from a course
   */
  removeStudent: async (courseId: string, studentId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/courses/${courseId}/students/${studentId}`);
    } catch (error) {
      console.error(`❌ Error removing student ${studentId} from course ${courseId}:`, error);
      throw error;
    }
  },
  /**
   * Get course statistics
   */
  getCourseStatistics: async (courseId: string): Promise<{
    enrollmentStats: {
      totalEnrolled: number;
      totalDropped: number;
      activeEnrollments: number;
    };
    assessmentStats: {
      totalAssessments: number;
      totalSubmissions: number;
      gradedSubmissions: number;
      pendingSubmissions: number;
    };
    performanceStats: {
      classAverage: number | null;
      submissionRate: number;
    };
  }> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/api/courses/${courseId}/students/statistics`
      );
      return response.data.data;
    } catch (error) {
      console.error(`❌ Error fetching statistics for course ${courseId}:`, error);
      throw error;
    }
  },
};
