import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Footer from '../components/common/Footer.jsx';
import { GraduationCap } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col justify-between">
      {/* Header */}
      <header className="p-4 sm:p-6 pt-safe">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-tight">
              JCC Examination Branch
            </span>
            <span className="text-[11px] text-slate-500 block">
              Rohini Sector 3, Delhi • Reappear Form System
            </span>
          </div>
        </Link>
      </header>

      {/* Auth Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthLayout;
