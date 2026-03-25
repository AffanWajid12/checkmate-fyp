// API Error response
export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  statusCode?: number;
}

// User types (backend shape)
export type UserRole = 'TEACHER' | 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile_picture?: string;
}

// Authentication types (Supabase does auth; backend only exposes /api/auth/me)
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GetCurrentUserResponse extends User {}

// ============= COURSE TYPES (backend shapes) =============

export interface BackendAnnouncement {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  comments?: BackendAnnouncementComment[];
  resources?: BackendAnnouncementResource[];
  assessments?: BackendAssessment[];
}

export interface BackendAnnouncementResource {
  id: string;
  signed_url: string;
  file_name?: string;
  mime_type?: string;
}

export interface BackendAnnouncementComment {
  id: string;
  content: string;
  createdAt?: string;
  user?: {
    id: string;
    name: string;
    role: UserRole;
    profile_picture?: string;
  };
}

export interface BackendAssessment {
  id: string;
  title: string;
  type: BackendAssessmentType;
  instructions?: string;
  due_date?: string;
  createdAt?: string;
  source_materials?: Array<{
    id: string;
    signed_url: string;
    file_name?: string;
    mime_type?: string;
  }>;
}

export type BackendAssessmentType = 'QUIZ' | 'ASSIGNMENT' | 'EXAM';

export interface CourseStudentEnrollment {
  student: User;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  code: string;
  teacher_id: string;
  students?: CourseStudentEnrollment[];
  announcements?: BackendAnnouncement[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseListItem {
  id: string;
  title: string;
  description?: string;
  code: string;
  teacher_id: string;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
}

// ============= ASSESSMENT TYPES =============

export type LegacyAssessmentType = 'exam' | 'quiz' | 'homework' | 'project' | 'assignment';
export type LegacyAssessmentStatus = 'upcoming' | 'active' | 'graded';

export interface LegacyAssessmentListItem {
  _id: string;
  course: string;
  title: string;
  type: LegacyAssessmentType;
  description?: string;
  totalPoints: number;
  dueDate: string;
  status: LegacyAssessmentStatus;
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

export interface LegacyAssessment {
  _id: string;
  course: {
    _id: string;
    code: string;
    title: string;
  };
  title: string;
  type: LegacyAssessmentType;
  description?: string;
  instructions?: string;
  totalPoints: number;
  dueDate: string;
  allowLateSubmissions: boolean;
  latePenalty: number;
  visibleToStudents: boolean;
  status: LegacyAssessmentStatus;
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

// Legacy: recent submission item used by some teacher assessment detail UIs
export interface RecentSubmission {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  submittedAt: string;
  grade?: number;
  status?: 'submitted' | 'graded' | 'late' | 'missing';
}

export interface LegacyGetAssessmentsRequest {
  status?: LegacyAssessmentStatus;
  type?: LegacyAssessmentType;
  sortBy?: 'dueDate' | 'createdAt' | 'title' | 'totalPoints';
  order?: 'asc' | 'desc';
}

export interface LegacyGetAssessmentsResponse {
  assessments: LegacyAssessmentListItem[];
  stats: {
    totalAssessments: number;
    activeAssessments: number;
    upcomingAssessments: number;
    completedAssessments: number;
  };
}

export interface LegacyCreateAssessmentRequest {
  title: string;
  type: LegacyAssessmentType;
  description?: string;
  instructions?: string;
  totalPoints: number;
  dueDate: string; // ISO 8601 format
  allowLateSubmissions?: boolean;
  latePenalty?: number;
  visibleToStudents?: boolean;
}

export interface LegacyUpdateAssessmentRequest {
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
