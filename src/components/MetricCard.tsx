import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  helperText?: string;
  icon: React.ComponentType<{ className?: string }>;
  status?: 'normal' | 'watch' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  helperText,
  icon: Icon,
  status = 'normal',
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'danger':
        return {
          border: 'border-rose-200 bg-rose-50/30',
          iconBg: 'bg-rose-100 text-rose-700',
          valueColor: 'text-rose-700',
        };
      case 'watch':
        return {
          border: 'border-amber-200 bg-amber-50/20',
          iconBg: 'bg-amber-100 text-amber-700',
          valueColor: 'text-amber-700',
        };
      case 'normal':
      default:
        return {
          border: 'border-slate-200/80 bg-white',
          iconBg: 'bg-blue-50 text-blue-600',
          valueColor: 'text-slate-900',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`p-4 rounded-xl border ${styles.border} shadow-2xs transition-all`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${styles.valueColor}`}>
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>

      {helperText && (
        <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
          {helperText}
        </div>
      )}
    </div>
  );
};
