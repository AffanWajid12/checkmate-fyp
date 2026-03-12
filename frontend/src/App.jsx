import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import React from "react";

import { AuthProvider } from "./components/AuthContext.jsx";
import RoleProtectedRoute from "./components/RoleProtectedRoute.jsx";


import LandingPage from "./pages/landingPage/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminLayout from "./pages/admin/Layout.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";

import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentCoursePage from "./pages/student/courses/CoursePage.jsx";
import StudentAttendancePage from "./pages/student/attendance/AttendancePage.jsx";
import StudentAssessmentPage from "./pages/student/courses/AssessmentPage.jsx";

import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import TeacherAttendanceOverview from "./pages/teacher/attendance/AttendanceOverview.jsx";
import TeacherAssignmentsOverview from "./pages/teacher/assignments/AssignmentsOverview.jsx";
import TeacherCoursePage from "./pages/teacher/courses/CoursePage/index.jsx";
import TeacherAttendancePage from "./pages/teacher/attendance/AttendancePage.jsx";
import AddAssessmentPage from "./pages/teacher/courses/AddAssessmentPage.jsx";
import TeacherAssessmentPage from "./pages/teacher/courses/AssessmentPage.jsx";
import ViewSubmissionPage from "./pages/teacher/courses/ViewSubmissionPage.jsx";

const queryClient = new QueryClient();

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2">
      <svg
        className="w-3 h-3 animate-spin text-current pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
        />
      </svg>
      Loading...
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <BrowserRouter>
          <React.Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Admin */}
              <Route
                path="/admin/*"
                element={
                  <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminLayout />
                  </RoleProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
              </Route>

              {/* Student */}
              <Route
                path="/student/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                    <StudentDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/courses"
                element={
                  <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                    <StudentDashboard defaultTab="courses" />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/attendance"
                element={
                  <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                    <StudentDashboard defaultTab="attendance" />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/courses/:courseId"
                element={
                  <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                    <StudentCoursePage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/courses/:courseId/attendance"
                element={
                  <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                    <StudentAttendancePage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/courses/:courseId/assessments/:assessmentId"
                element={
                  <RoleProtectedRoute allowedRoles={["STUDENT"]}>
                    <StudentAssessmentPage />
                  </RoleProtectedRoute>
                }
              />

              {/* Teacher */}
              <Route
                path="/teacher/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={["TEACHER"]}>
                    <TeacherDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/teacher/attendance"
                element={
                  <RoleProtectedRoute allowedRoles={["TEACHER"]}>
                    <TeacherAttendanceOverview />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/teacher/assignments"
                element={
                  <RoleProtectedRoute allowedRoles={["TEACHER"]}>
                    <TeacherAssignmentsOverview />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/teacher/courses/:courseId"
                element={
                  <RoleProtectedRoute allowedRoles={["TEACHER"]}>
                    <TeacherCoursePage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/teacher/courses/:courseId/attendance"
                element={
                  <RoleProtectedRoute allowedRoles={["TEACHER"]}>
                    <TeacherAttendancePage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/teacher/courses/:courseId/add-assessment"
                element={
                  <RoleProtectedRoute allowedRoles={["TEACHER"]}>
                    <AddAssessmentPage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/teacher/courses/:courseId/assessments/:assessmentId"
                element={
                  <RoleProtectedRoute allowedRoles={["TEACHER"]}>
                    <TeacherAssessmentPage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/teacher/courses/:courseId/assessments/:assessmentId/submissions/:submissionId"
                element={
                  <RoleProtectedRoute allowedRoles={["TEACHER"]}>
                    <ViewSubmissionPage />
                  </RoleProtectedRoute>
                }
              />

              <Route path="/*" element={<Navigate to="/login" replace />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
