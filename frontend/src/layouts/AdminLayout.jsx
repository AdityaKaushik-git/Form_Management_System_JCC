import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Footer from '../components/common/Footer.jsx';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  FileCheck2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  Calendar,
  Layers,
  Building,
  Bell,
  ShieldAlert,
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    academic: true,
    forms: true,
  });

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-600 font-semibold'
        : 'text-content-secondary hover:text-content-primary hover:bg-gray-50'
    }`;

  const subNavLinkClasses = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-1.5 pl-8 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? 'text-primary-600 font-semibold'
        : 'text-content-muted hover:text-content-primary hover:bg-gray-50'
    }`;

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-1.5 text-content-secondary hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              JCC
            </div>
            <div>
              <h1 className="text-sm font-bold text-content-primary leading-tight">
                JCC Reappear Exam System
              </h1>
              <p className="text-[10px] text-content-muted">Admin Portal • Rohini Sector 3, Delhi</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-content-primary">{user?.fullName || 'Admin User'}</span>
            <span className="text-[10px] text-content-muted">{user?.email}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Dashboard */}
            <NavLink to="/admin/dashboard" className={navLinkClasses}>
              <LayoutDashboard className="w-4 h-4 text-primary-500" />
              <span>Dashboard</span>
            </NavLink>

            {/* Students */}
            <NavLink to="/admin/students" className={navLinkClasses}>
              <Users className="w-4 h-4 text-blue-500" />
              <span>Student Management</span>
            </NavLink>

            {/* Academic Management Group */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => toggleGroup('academic')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-content-muted uppercase tracking-wider hover:text-content-primary"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Academic</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${expandedGroups.academic ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedGroups.academic && (
                <div className="space-y-0.5 mt-1">
                  <NavLink to="/admin/courses" className={subNavLinkClasses}>
                    Courses
                  </NavLink>
                  <NavLink to="/admin/batches" className={subNavLinkClasses}>
                    Batches
                  </NavLink>
                  <NavLink to="/admin/semesters" className={subNavLinkClasses}>
                    Semesters
                  </NavLink>
                  <NavLink to="/admin/subjects" className={subNavLinkClasses}>
                    Subjects
                  </NavLink>
                </div>
              )}
            </div>

            {/* Examination Forms Group */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => toggleGroup('forms')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-content-muted uppercase tracking-wider hover:text-content-primary"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Exam Forms</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${expandedGroups.forms ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedGroups.forms && (
                <div className="space-y-0.5 mt-1">
                  <NavLink to="/admin/forms" end className={subNavLinkClasses}>
                    All Forms
                  </NavLink>
                  <NavLink to="/admin/forms/create" className={subNavLinkClasses}>
                    Create Form Builder
                  </NavLink>
                </div>
              )}
            </div>

            {/* Submissions */}
            <div className="pt-2">
              <NavLink to="/admin/submissions" className={navLinkClasses}>
                <FileCheck2 className="w-4 h-4 text-purple-500" />
                <span>Submissions</span>
              </NavLink>
            </div>

            {/* Reports */}
            <NavLink to="/admin/reports" className={navLinkClasses}>
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Reports & Export</span>
            </NavLink>

            {/* Settings & Audit */}
            <div className="pt-3 border-t border-gray-100 mt-3 space-y-1">
              <NavLink to="/admin/settings" className={navLinkClasses}>
                <Settings className="w-4 h-4 text-gray-500" />
                <span>System Settings</span>
              </NavLink>
              <NavLink to="/admin/audit-logs" className={navLinkClasses}>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Audit Logs</span>
              </NavLink>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminLayout;
