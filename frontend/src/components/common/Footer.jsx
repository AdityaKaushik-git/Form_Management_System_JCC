import React from 'react';

const Footer = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`py-4 px-6 border-t border-gray-100 bg-white text-center text-xs text-content-muted ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p>© {currentYear} JCC Rohini, Sector 3. All Rights Reserved.</p>
        <p className="font-medium text-content-secondary">
          Designed by <span className="text-primary-600 font-semibold">Aditya Kaushik</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
