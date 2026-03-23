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

export interface Announcement {
  id: string;
  title: string;
  description: string;
}

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
  announcements?: Announcement[];
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
