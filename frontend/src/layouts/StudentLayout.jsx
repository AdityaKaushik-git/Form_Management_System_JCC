import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Footer from '../components/common/Footer.jsx';
import { LayoutDashboard, FileText, History, User, LogOut, GraduationCap } from 'lucide-react';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const desktopNavClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
      isActive
        ? 'bg-primary-50 text-primary-600 font-semibold'
        : 'text-content-secondary hover:text-content-primary hover:bg-gray-50'
    }`;

  const mobileBottomNavClass = ({ isActive }) =>
    `flex flex-col items-center justify-center flex-1 py-1.5 px-1 min-h-[48px] touch-manipulation transition-all duration-150 ${
      isActive
        ? 'text-primary-600 font-semibold'
        : 'text-content-muted hover:text-content-secondary'
    }`;

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-xs gpu-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-slate-900 leading-tight">
                  JCC Student Portal
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-700 border border-primary-200/60">
                  Examination
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                Reappear Examination System • Rohini Sector 3, Delhi
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/student/dashboard" className={desktopNavClass}>
              <LayoutDashboard className="w-4 h-4 text-primary-500" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/student/forms" className={desktopNavClass}>
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Available Forms</span>
            </NavLink>
            <NavLink to="/student/applications" className={desktopNavClass}>
              <History className="w-4 h-4 text-blue-500" />
              <span>My Applications</span>
            </NavLink>
            <NavLink to="/student/profile" className={desktopNavClass}>
              <User className="w-4 h-4 text-purple-500" />
              <span>Profile</span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-content-primary truncate max-w-[150px]">
                {user?.fullName}
              </span>
              <span className="text-[10px] text-content-muted font-mono">
                {user?.studentProfile?.enrollmentNumber || user?.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors touch-manipulation min-h-[36px]"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-4 sm:py-6 px-3 sm:px-6 max-w-7xl mx-auto w-full pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Sticky Bottom Navigation Bar (iOS / Android) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 pb-safe shadow-lg gpu-layer">
        <div className="flex items-center justify-around px-1 max-w-md mx-auto">
          <NavLink to="/student/dashboard" className={mobileBottomNavClass}>
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Dashboard</span>
          </NavLink>
          <NavLink to="/student/forms" className={mobileBottomNavClass}>
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Forms</span>
          </NavLink>
          <NavLink to="/student/applications" className={mobileBottomNavClass}>
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">History</span>
          </NavLink>
          <NavLink to="/student/profile" className={mobileBottomNavClass}>
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Profile</span>
          </NavLink>
        </div>
      </nav>

      <Footer className="hidden md:block" />
      <div className="md:hidden pb-16">
        <Footer />
      </div>
    </div>
  );
};

export default StudentLayout;
