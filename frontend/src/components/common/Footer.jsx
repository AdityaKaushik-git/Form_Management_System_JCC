import React from 'react';
import { Building2 } from 'lucide-react';

const Footer = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`py-4 px-6 border-t border-slate-200/80 bg-white text-xs text-slate-500 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>© {currentYear} JCC Rohini, Sector 3, Delhi • Examination Branch</span>
        </p>
        <p className="font-medium text-slate-600">
          Designed by <span className="text-primary-600 font-semibold">Aditya Kaushik</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
