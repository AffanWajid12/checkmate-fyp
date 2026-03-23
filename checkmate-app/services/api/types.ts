// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

// API Error response
export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  statusCode?: number;
}

// User types
export type UserRole = 'professor' | 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: UserRole;
  department?: string;
  studentNumber?: string;
  profileImage?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Authentication types
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  expiresIn: number;
}

export interface GetCurrentUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  department?: string;
  profileImage?: string;
}

// ============= COURSE TYPES =============

export interface Schedule {
  days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>;
  time: string;
  location: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  postedBy: string;
  postedAt: string;
}

export interface Course {
  _id: string;
  title: string;
  code: string;
  section: string;
  semester: string;
  year: number;
  description?: string;
  credits: number;
  professor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
  schedule?: Schedule;
  maxStudents: number;
  enrolledStudents: number;
  assessmentCount: number;
  announcements: Announcement[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListItem {
  _id: string;
  title: string;
  code: string;
  section: string;
  semester: string;
  year: number;
  professor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  enrolledStudents: number;
  assessmentCount: number;
  schedule?: Schedule;
}

export interface GetCoursesRequest {
  page?: number;
  limit?: number;
  semester?: string;
  year?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface GetCoursesResponse {
  courses: CourseListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCourses: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateCourseRequest {
  title: string;
  code: string;
  section: string;
  semester: string;
  year: number;
  description?: string;
  credits?: number;
  schedule?: Schedule;
  maxStudents?: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  credits?: number;
  schedule?: Schedule;
  maxStudents?: number;
  isActive?: boolean;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
}

// ============= ASSESSMENT TYPES =============

export type AssessmentType = 'exam' | 'quiz' | 'homework' | 'project' | 'assignment';
export type AssessmentStatus = 'upcoming' | 'active' | 'graded';

export interface AssessmentListItem {
  _id: string;
  course: string;
  title: string;
  type: AssessmentType;
  description?: string;
  totalPoints: number;
  dueDate: string;
  status: AssessmentStatus;
  submissionCount: number;
  totalStudents: number;
  gradedCount: number;
  notGradedCount: number;
  avgGrade?: number;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  _id: string;
  course: {
    _id: string;
    code: string;
    title: string;
  };
  title: string;
  type: AssessmentType;
  description?: string;
  instructions?: string;
  totalPoints: number;
  dueDate: string;
  allowLateSubmissions: boolean;
  latePenalty: number;
  visibleToStudents: boolean;
  status: AssessmentStatus;
  submissionStats: {
    submitted: number;
    notSubmitted: number;
    graded: number;
    notGraded: number;
    totalStudents: number;
  };
  recentSubmissions: RecentSubmission[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string;
  status: 'graded' | 'not-graded';
  grade: number | null;
  percentage: number | null;
  fileCount: number;
}

export interface GetAssessmentsRequest {
  status?: AssessmentStatus;
  type?: AssessmentType;
  sortBy?: 'dueDate' | 'createdAt' | 'title' | 'totalPoints';
  order?: 'asc' | 'desc';
}

export interface GetAssessmentsResponse {
  assessments: AssessmentListItem[];
  stats: {
    totalAssessments: number;
    activeAssessments: number;
    upcomingAssessments: number;
    completedAssessments: number;
  };
}

export interface CreateAssessmentRequest {
  title: string;
  type: AssessmentType;
  description?: string;
  instructions?: string;
  totalPoints: number;
  dueDate: string; // ISO 8601 format
  allowLateSubmissions?: boolean;
  latePenalty?: number;
  visibleToStudents?: boolean;
}

export interface UpdateAssessmentRequest {
  title?: string;
  description?: string;
  instructions?: string;
  totalPoints?: number;
  dueDate?: string;
  allowLateSubmissions?: boolean;
  latePenalty?: number;
  visibleToStudents?: boolean;
  isActive?: boolean;
}
