import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Footer from '../components/common/Footer.jsx';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col justify-between">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
            JCC
          </div>
          <div>
            <span className="font-bold text-sm text-content-primary block leading-tight">
              JCC, Rohini Sector 3
            </span>
            <span className="text-[11px] text-content-muted block">
              Reappear Examination Management System
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
