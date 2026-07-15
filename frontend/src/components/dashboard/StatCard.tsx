import React from 'react';
import { cn } from '../../utils/helpers';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  className?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'from-blue-500 to-indigo-600',
  className,
  onClick
}) => {
  return (
    <div 
      className={cn(
        'relative bg-gradient-to-r rounded-2xl p-5 transition-all cursor-pointer hover:-translate-y-2 hover:shadow-xl',
        color,
        className
      )}
      onClick={onClick}
    >
      <div className="relative z-10">
        <div className="text-3xl font-extrabold text-white drop-shadow-lg">
          {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
        </div>
        <div className="text-white/90 text-sm font-medium mt-1">{title}</div>
      </div>
      <div className="absolute bottom-3 left-4 text-5xl opacity-10 z-0">
        {icon}
      </div>
      <div className="absolute inset-1 rounded-2xl border border-white/20 pointer-events-none" />
      <div className="absolute top-1 left-3 right-3 h-1/3 rounded-3xl bg-white/10 pointer-events-none" />
    </div>
  );
};

export default StatCard;