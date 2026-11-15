import React, { useState, useEffect } from 'react';
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
  Shield,
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

  // Automatically close sidebar on mobile when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation min-h-[40px] ${
      isActive
        ? 'bg-primary-50 text-primary-600 font-semibold'
        : 'text-content-secondary hover:text-content-primary hover:bg-gray-50'
    }`;

  const subNavLinkClasses = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 pl-8 rounded-lg text-xs font-medium transition-colors touch-manipulation min-h-[36px] ${
      isActive
        ? 'text-primary-600 font-semibold bg-primary-50/50'
        : 'text-content-muted hover:text-content-primary hover:bg-gray-50'
    }`;

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-xs gpu-layer">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-content-secondary hover:bg-gray-100 active:bg-gray-200 rounded-lg touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs shrink-0">
              <Shield className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-slate-900 leading-tight">
                  JCC Administration
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Exam Branch
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                Reappear Examination System • Rohini Sector 3, Delhi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-content-primary truncate max-w-[150px]">
              {user?.fullName || 'Admin User'}
            </span>
            <span className="text-[10px] text-content-muted truncate max-w-[150px]">
              {user?.email}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors touch-manipulation min-h-[36px]"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 lg:hidden transition-opacity gpu-layer"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 pb-safe gpu-layer ${
            isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          {/* Mobile Sidebar Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-xs">
                JCC
              </div>
              <span className="font-bold text-xs text-content-primary">Admin Navigation</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-content-muted hover:text-content-primary rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto touch-scroll p-3 sm:p-4 space-y-1">
            {/* Dashboard */}
            <NavLink
              to="/admin/dashboard"
              className={navLinkClasses}
              onClick={() => setIsSidebarOpen(false)}
            >
              <LayoutDashboard className="w-4 h-4 text-primary-500 shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            {/* Students */}
            <NavLink
              to="/admin/students"
              className={navLinkClasses}
              onClick={() => setIsSidebarOpen(false)}
            >
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Student Management</span>
            </NavLink>

            {/* Academic Management Group */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => toggleGroup('academic')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-content-muted uppercase tracking-wider hover:text-content-primary touch-manipulation"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Academic</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    expandedGroups.academic ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedGroups.academic && (
                <div className="space-y-0.5 mt-1">
                  <NavLink
                    to="/admin/courses"
                    className={subNavLinkClasses}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Courses
                  </NavLink>
                  <NavLink
                    to="/admin/batches"
                    className={subNavLinkClasses}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Batches
                  </NavLink>
                  <NavLink
                    to="/admin/semesters"
                    className={subNavLinkClasses}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Semesters
                  </NavLink>
                  <NavLink
                    to="/admin/subjects"
                    className={subNavLinkClasses}
                    onClick={() => setIsSidebarOpen(false)}
                  >
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
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-content-muted uppercase tracking-wider hover:text-content-primary touch-manipulation"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Exam Forms</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    expandedGroups.forms ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedGroups.forms && (
                <div className="space-y-0.5 mt-1">
                  <NavLink
                    to="/admin/forms"
                    end
                    className={subNavLinkClasses}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    All Forms
                  </NavLink>
                  <NavLink
                    to="/admin/forms/create"
                    className={subNavLinkClasses}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Create Form Builder
                  </NavLink>
                </div>
              )}
            </div>

            {/* Submissions */}
            <div className="pt-2">
              <NavLink
                to="/admin/submissions"
                className={navLinkClasses}
                onClick={() => setIsSidebarOpen(false)}
              >
                <FileCheck2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Submissions</span>
              </NavLink>
            </div>

            {/* Reports */}
            <NavLink
              to="/admin/reports"
              className={navLinkClasses}
              onClick={() => setIsSidebarOpen(false)}
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
              <span>Reports & Export</span>
            </NavLink>

            {/* Settings & Audit */}
            <div className="pt-3 border-t border-gray-100 mt-3 space-y-1">
              <NavLink
                to="/admin/settings"
                className={navLinkClasses}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Settings className="w-4 h-4 text-gray-500 shrink-0" />
                <span>System Settings</span>
              </NavLink>
              <NavLink
                to="/admin/audit-logs"
                className={navLinkClasses}
                onClick={() => setIsSidebarOpen(false)}
              >
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Audit Logs</span>
              </NavLink>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto touch-scroll p-3 sm:p-6 lg:p-8">
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
