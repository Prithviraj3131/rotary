import React from 'react';

interface DemoBadgeProps {
  className?: string;
  label?: string;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ className = '', label = 'DEMO' }) => {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-800 border border-amber-500/40 select-none ${className}`}
      title="Simulated / Seeded test item for demonstration"
    >
      {label}
    </span>
  );
};
