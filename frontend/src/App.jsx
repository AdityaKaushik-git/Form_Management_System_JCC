import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

// Layouts
import AuthLayout from './layouts/AuthLayout.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// Auth Pages
import LandingPage from './pages/auth/LandingPage.jsx';
import StudentLogin from './pages/auth/StudentLogin.jsx';
import StudentRegister from './pages/auth/StudentRegister.jsx';
import AdminLogin from './pages/auth/AdminLogin.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentProfile from './pages/student/StudentProfile.jsx';
import AvailableForms from './pages/student/AvailableForms.jsx';
import ApplicationForm from './pages/student/ApplicationForm.jsx';
import MyApplications from './pages/student/MyApplications.jsx';
import ApplicationDetail from './pages/student/ApplicationDetail.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import StudentsList from './pages/admin/StudentsList.jsx';
import CoursesList from './pages/admin/CoursesList.jsx';
import BatchesList from './pages/admin/BatchesList.jsx';
import SemestersList from './pages/admin/SemestersList.jsx';
import SubjectsList from './pages/admin/SubjectsList.jsx';
import FormsList from './pages/admin/FormsList.jsx';
import FormBuilder from './pages/admin/FormBuilder.jsx';
import SheetsManager from './pages/admin/SheetsManager.jsx';
import ColumnMapper from './pages/admin/ColumnMapper.jsx';
import SubmissionsList from './pages/admin/SubmissionsList.jsx';
import SubmissionDetail from './pages/admin/SubmissionDetail.jsx';
import ReportsPage from './pages/admin/ReportsPage.jsx';
import AuditLogsPage from './pages/admin/AuditLogsPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Flow */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<StudentLogin />} />
            <Route path="/register" element={<StudentRegister />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          {/* Student Protected Portal */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="forms" element={<AvailableForms />} />
            <Route path="forms/:id/apply" element={<ApplicationForm />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
          </Route>

          {/* Admin Protected Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<StudentsList />} />
            <Route path="courses" element={<CoursesList />} />
            <Route path="batches" element={<BatchesList />} />
            <Route path="semesters" element={<SemestersList />} />
            <Route path="subjects" element={<SubjectsList />} />
            <Route path="forms" element={<FormsList />} />
            <Route path="forms/create" element={<FormBuilder />} />
            <Route path="forms/:id/edit" element={<FormBuilder />} />
            <Route path="forms/:formId/sheets" element={<SheetsManager />} />
            <Route path="sheets/:sheetId/mappings" element={<ColumnMapper />} />
            <Route path="submissions" element={<SubmissionsList />} />
            <Route path="submissions/:id" element={<SubmissionDetail />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
