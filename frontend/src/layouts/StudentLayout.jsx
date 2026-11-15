import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Footer from '../components/common/Footer.jsx';
import { LayoutDashboard, FileText, History, User, LogOut } from 'lucide-react';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-600 font-semibold'
        : 'text-content-secondary hover:text-content-primary hover:bg-gray-50'
    }`;

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              JCC
            </div>
            <div>
              <h1 className="text-sm font-bold text-content-primary leading-tight">
                JCC Student Portal
              </h1>
              <p className="text-[10px] text-content-muted">Reappear Examination System • Rohini Sector 3</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/student/dashboard" className={navClass}>
              <LayoutDashboard className="w-4 h-4 text-primary-500" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/student/forms" className={navClass}>
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Available Forms</span>
            </NavLink>
            <NavLink to="/student/applications" className={navClass}>
              <History className="w-4 h-4 text-blue-500" />
              <span>My Applications</span>
            </NavLink>
            <NavLink to="/student/profile" className={navClass}>
              <User className="w-4 h-4 text-purple-500" />
              <span>Profile</span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-content-primary">{user?.fullName}</span>
              <span className="text-[10px] text-content-muted">
                {user?.studentProfile?.enrollmentNumber || user?.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden border-t border-gray-100 px-4 py-2 flex items-center justify-around bg-surface-secondary">
          <NavLink to="/student/dashboard" className={navClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-xs">Dashboard</span>
          </NavLink>
          <NavLink to="/student/forms" className={navClass}>
            <FileText className="w-4 h-4" />
            <span className="text-xs">Forms</span>
          </NavLink>
          <NavLink to="/student/applications" className={navClass}>
            <History className="w-4 h-4" />
            <span className="text-xs">History</span>
          </NavLink>
          <NavLink to="/student/profile" className={navClass}>
            <User className="w-4 h-4" />
            <span className="text-xs">Profile</span>
          </NavLink>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default StudentLayout;
