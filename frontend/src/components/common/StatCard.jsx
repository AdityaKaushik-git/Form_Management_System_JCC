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
    primary: 'bg-primary-50 text-primary-600 border-primary-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{value}</h4>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trend && (
          <span className="inline-flex items-center text-xs font-semibold text-emerald-600 mt-2">
            {trend}
          </span>
        )}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-xl border shrink-0 ${colors[color] || colors.primary}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
