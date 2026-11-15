import React from 'react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  subtitle,
}) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-card flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-bold text-content-primary mt-1.5">{value}</h4>
        {subtitle && <p className="text-xs text-content-muted mt-1">{subtitle}</p>}
        {trend && (
          <span className="inline-flex items-center text-xs font-medium text-emerald-600 mt-2">
            {trend}
          </span>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${colors[color] || colors.primary}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
