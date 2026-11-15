import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';

// Layouts (eagerly loaded for instant frame rendering)
import AuthLayout from './layouts/AuthLayout.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// Core Auth Pages (eagerly loaded for zero-delay first paint)
import LandingPage from './pages/auth/LandingPage.jsx';
import StudentLogin from './pages/auth/StudentLogin.jsx';
import AdminLogin from './pages/auth/AdminLogin.jsx';

// Lazy Loaded Secondary Auth Pages
const StudentRegister = lazy(() => import('./pages/auth/StudentRegister.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail.jsx'));

// Lazy Loaded Student Pages (Splits bundle for mobile performance)
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard.jsx'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile.jsx'));
const AvailableForms = lazy(() => import('./pages/student/AvailableForms.jsx'));
const ApplicationForm = lazy(() => import('./pages/student/ApplicationForm.jsx'));
const MyApplications = lazy(() => import('./pages/student/MyApplications.jsx'));
const ApplicationDetail = lazy(() => import('./pages/student/ApplicationDetail.jsx'));

// Lazy Loaded Admin Pages & Heavy Visualization Tools
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const StudentsList = lazy(() => import('./pages/admin/StudentsList.jsx'));
const CoursesList = lazy(() => import('./pages/admin/CoursesList.jsx'));
const BatchesList = lazy(() => import('./pages/admin/BatchesList.jsx'));
const SemestersList = lazy(() => import('./pages/admin/SemestersList.jsx'));
const SubjectsList = lazy(() => import('./pages/admin/SubjectsList.jsx'));
const FormsList = lazy(() => import('./pages/admin/FormsList.jsx'));
const FormBuilder = lazy(() => import('./pages/admin/FormBuilder.jsx'));
const SheetsManager = lazy(() => import('./pages/admin/SheetsManager.jsx'));
const ColumnMapper = lazy(() => import('./pages/admin/ColumnMapper.jsx'));
const SubmissionsList = lazy(() => import('./pages/admin/SubmissionsList.jsx'));
const SubmissionDetail = lazy(() => import('./pages/admin/SubmissionDetail.jsx'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage.jsx'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage.jsx'));

const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-6">
    <LoadingSpinner message="Loading..." />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Suspense fallback={<PageFallback />}>
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
        </Suspense>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
