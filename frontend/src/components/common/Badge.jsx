import React from 'react';
import { getStatusBadgeClass } from '../../utils/helpers.js';

const Badge = ({
  children,
  variant,
  className = '',
}) => {
  const badgeStyle = variant ? getStatusBadgeClass(variant) : 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyle} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
