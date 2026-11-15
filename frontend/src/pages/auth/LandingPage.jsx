import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer.jsx';
import Button from '../../components/common/Button.jsx';
import {
  GraduationCap,
  FileCheck2,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  ArrowRight,
  User,
  Shield,
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              JCC
            </div>
            <div>
              <h1 className="text-base font-bold text-content-primary leading-tight">
                JCC, Rohini Sector 3, Delhi
              </h1>
              <p className="text-xs text-content-muted">Reappear Examination Form Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Student Login
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button variant="primary" size="sm">
                Admin Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold mb-6">
            <Clock className="w-3.5 h-3.5" />
            Official Examination Portal • Session 2026-2027
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-content-primary tracking-tight max-w-3xl mx-auto">
            Seamless College <span className="text-primary-500">Reappear Examination</span> Form Management
          </h1>

          <p className="mt-4 text-base sm:text-lg text-content-secondary max-w-2xl mx-auto">
            Fast, secure, and unified platform for JCC students to apply for reappear examinations and for administrators to manage forms and automate Google Sheets reporting.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto px-8" icon={User}>
                Student Portal
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                New Student Registration
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="py-12 bg-surface-secondary border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-content-primary">System Capabilities</h2>
              <p className="text-xs text-content-muted mt-1">Built with high-availability architecture and multi-department synchronization</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-card">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-content-primary">Dynamic Examination Forms</h3>
                <p className="text-xs text-content-secondary mt-2 leading-relaxed">
                  Configurable form builder supporting dynamic fields, subject selection, start/end scheduling, and Permanent Active mode.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-card">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-content-primary">Multi-Sheet Syncing</h3>
                <p className="text-xs text-content-secondary mt-2 leading-relaxed">
                  Automatic background synchronization to multiple department Google Sheets (Exam, Accounts, Contacts) with custom column mappings.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-card">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-content-primary">Instant PDF Receipts</h3>
                <p className="text-xs text-content-secondary mt-2 leading-relaxed">
                  Tamper-proof student acknowledgement receipts with official reference numbers, subject list, and instant verification.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
