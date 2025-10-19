import React from 'react';

interface RecordingIndicatorProps {
  label?: string;
  isLive?: boolean;
}

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({ 
  label = 'Recording...', 
  isLive = false 
}) => (
  <div className={`${isLive ? 'bg-white' : 'border-2 border-red-500 bg-red-50'} rounded-lg p-4 text-center`}>
    <div className={`animate-pulse ${isLive ? 'text-red-500' : 'text-red-500'} ${isLive ? 'font-semibold mb-2' : 'text-4xl mb-2'}`}>
      ●{isLive ? ' LIVE' : ''}
    </div>
    <p className="text-sm text-neutral-600 mb-3">{label}</p>
  </div>
);

