import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminLayout from "./pages/admin/Layout.jsx";
import AdminDashboard from "./pages/admin/dashboard.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";

import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentCoursePage from "./pages/student/courses/CoursePage.jsx";
import StudentAttendancePage from "./pages/student/attendance/AttendancePage.jsx";

import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import TeacherCoursePage from "./pages/teacher/courses/CoursePage.jsx";
import TeacherAttendancePage from "./pages/teacher/attendance/AttendancePage.jsx";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          {/* Student */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/courses/:courseId" element={<StudentCoursePage />} />
          <Route path="/student/courses/:courseId/attendance" element={<StudentAttendancePage />} />

          {/* Teacher */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/courses/:courseId" element={<TeacherCoursePage />} />
          <Route path="/teacher/courses/:courseId/attendance" element={<TeacherAttendancePage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
