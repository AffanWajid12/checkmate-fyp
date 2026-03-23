import { apiClient } from './config';
import type {
    Course,
    CourseListItem,
    CreateCourseRequest,
} from './types';

/**
 * Course Management Service
 * Backend-aligned endpoints.
 */
class CourseService {
  /**
   * Teacher: GET /api/courses/my-courses
   * Response: 200 { message, courses }
   */
  async getMyCourses(): Promise<CourseListItem[]> {
    console.log('📚 Fetching teacher courses (/my-courses)');

    const response = await apiClient.get<{ message: string; courses: CourseListItem[] }>(
      '/api/courses/my-courses'
    );

    console.log(`✅ Retrieved ${response.data.courses.length} courses`);
    return response.data.courses;
  }

  /**
   * Teacher list endpoint includes nested students + announcements.
   * This finds the course by id from /my-courses.
   */
  async getMyCourseById(courseId: string): Promise<Course> {
    console.log('📖 Fetching course details from /my-courses:', courseId);

    const response = await apiClient.get<{ message: string; courses: Course[] }>(
      '/api/courses/my-courses'
    );

    const course = response.data.courses.find((c) => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  /**
   * Teacher: POST /api/courses
   * Body: { title, description? }
   * Response: 201 { message, course }
   */
  async createCourse(data: CreateCourseRequest): Promise<Course> {
    console.log('➕ Creating course:', data.title);

    const response = await apiClient.post<{ message: string; course: Course }>(
      '/api/courses',
      data
    );

    console.log('✅ Course created successfully:', response.data.course.id);
    return response.data.course;
  }

  /**
   * Teacher: DELETE /api/courses/:id
   */
  async deleteCourse(courseId: string): Promise<void> {
    console.log('🗑️ Deleting course:', courseId);
    await apiClient.delete<{ message: string }>(`/api/courses/${courseId}`);
    console.log('✅ Course deleted successfully');
  }
}

export const courseService = new CourseService();
