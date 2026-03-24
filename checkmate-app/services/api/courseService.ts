import { apiClient } from './config';
import type {
    BackendAnnouncement,
    BackendAnnouncementComment,
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

  /**
   * Shared: GET /api/courses/:courseId/announcements
   * Response: 200 { message, announcements }
   */
  async getCourseAnnouncements(courseId: string): Promise<BackendAnnouncement[]> {
    console.log('📣 Fetching course announcements:', courseId);

    const response = await apiClient.get<{ message: string; announcements: BackendAnnouncement[] }>(
      `/api/courses/${courseId}/announcements`
    );

    return response.data.announcements;
  }

  /**
   * Teacher: POST /api/courses/:courseId/announcements (multipart)
   * fields: title, description
   * files: files[] (optional)
   */
  async createAnnouncement(
    courseId: string,
    data: { title: string; description: string; files?: Array<{ uri: string; name: string; type?: string }> }
  ): Promise<BackendAnnouncement> {
    console.log('➕ Creating announcement:', courseId);

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);

    if (data.files?.length) {
      for (const f of data.files) {
        formData.append('files', {
          uri: f.uri,
          name: f.name,
          type: f.type ?? 'application/octet-stream',
        } as any);
      }
    }

    const response = await apiClient.post<{ message: string; announcement: BackendAnnouncement }>(
      `/api/courses/${courseId}/announcements`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return response.data.announcement;
  }

  /**
   * Teacher: POST /api/courses/:courseId/announcements/:announcementId/comments
   * Body: { content }
   * Response: 201 { message, comment }
   */
  async addAnnouncementComment(
    courseId: string,
    announcementId: string,
    content: string
  ): Promise<BackendAnnouncementComment> {
    const response = await apiClient.post<{ message: string; comment: BackendAnnouncementComment }>(
      `/api/courses/${courseId}/announcements/${announcementId}/comments`,
      { content }
    );

    return response.data.comment;
  }

  /**
   * Teacher: DELETE /api/courses/:courseId/announcements/:announcementId/comments/:commentId
   */
  async deleteAnnouncementComment(
    courseId: string,
    announcementId: string,
    commentId: string
  ): Promise<void> {
    await apiClient.delete<{ message: string }>(
      `/api/courses/${courseId}/announcements/${announcementId}/comments/${commentId}`
    );
  }
}

export const courseService = new CourseService();
