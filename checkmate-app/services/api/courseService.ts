import { apiClient } from './config';
import type {
    Announcement,
    ApiResponse,
    Course,
    CreateAnnouncementRequest,
    CreateCourseRequest,
    GetCoursesRequest,
    GetCoursesResponse,
    UpdateCourseRequest,
} from './types';

/**
 * Course Management Service
 * Handles all course-related API operations
 */
class CourseService {
  /**
   * Get all courses with optional filters and pagination
   * @param params - Query parameters for filtering and pagination
   */
  async getCourses(params?: GetCoursesRequest): Promise<GetCoursesResponse> {
    console.log('📚 Fetching courses with params:', params);
    
    const response = await apiClient.get<ApiResponse<GetCoursesResponse>>('/api/courses', {
      params,
    });
    
    console.log(`✅ Retrieved ${response.data.data.courses.length} courses`);
    return response.data.data;
  }

  /**
   * Get a single course by ID
   * @param courseId - The course ID
   */
  async getCourseById(courseId: string): Promise<Course> {
    console.log('📖 Fetching course:', courseId);
    
    const response = await apiClient.get<ApiResponse<Course>>(`/api/courses/${courseId}`);
    
    console.log('✅ Course retrieved:', response.data.data.title);
    return response.data.data;
  }

  /**
   * Create a new course
   * @param data - Course creation data
   */
  async createCourse(data: CreateCourseRequest): Promise<Course> {
    console.log('➕ Creating course:', data.title, data.code);
    
    const response = await apiClient.post<ApiResponse<Course>>('/api/courses', data);
    
    console.log('✅ Course created successfully:', response.data.data._id);
    return response.data.data;
  }

  /**
   * Update an existing course
   * @param courseId - The course ID
   * @param data - Fields to update
   */
  async updateCourse(courseId: string, data: UpdateCourseRequest): Promise<Course> {
    console.log('📝 Updating course:', courseId);
    
    const response = await apiClient.patch<ApiResponse<Course>>(
      `/api/courses/${courseId}`,
      data
    );
    
    console.log('✅ Course updated successfully');
    return response.data.data;
  }

  /**
   * Delete a course (soft delete)
   * @param courseId - The course ID
   */
  async deleteCourse(courseId: string): Promise<void> {
    console.log('🗑️ Deleting course:', courseId);
    
    await apiClient.delete<ApiResponse<null>>(`/api/courses/${courseId}`);
    
    console.log('✅ Course deleted successfully');
  }

  /**
   * Add an announcement to a course
   * @param courseId - The course ID
   * @param data - Announcement data
   */
  async addAnnouncement(
    courseId: string,
    data: CreateAnnouncementRequest
  ): Promise<Announcement> {
    console.log('📢 Adding announcement to course:', courseId);
    
    const response = await apiClient.post<ApiResponse<Announcement>>(
      `/api/courses/${courseId}/announcements`,
      data
    );
    
    console.log('✅ Announcement added successfully');
    return response.data.data;
  }

  /**
   * Get courses with search functionality
   * @param searchQuery - Search term
   */
  async searchCourses(searchQuery: string): Promise<GetCoursesResponse> {
    console.log('🔍 Searching courses:', searchQuery);
    
    return this.getCourses({
      search: searchQuery,
      limit: 50,
    });
  }

  /**
   * Get courses for a specific semester
   * @param semester - Semester name
   * @param year - Year
   */
  async getCoursesBySemester(semester: string, year: number): Promise<GetCoursesResponse> {
    console.log('📅 Fetching courses for:', semester, year);
    
    return this.getCourses({
      semester,
      year,
    });
  }
}

export const courseService = new CourseService();
