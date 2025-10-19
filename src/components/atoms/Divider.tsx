import React from 'react';

interface DividerProps {
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ label }) => (
  <div className="flex items-center">
    <div className="flex-1 border-t border-neutral-300" />
    {label && <span className="px-4 text-sm font-medium text-neutral-500">{label}</span>}
    <div className="flex-1 border-t border-neutral-300" />
  </div>
);

