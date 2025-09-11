import React from 'react';
import { getStatusConfig } from '../dashboard/StatusConfig';

const StatusPill = ({ status, theme, showPulseOnActive = false, className = '' }) => {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        theme === 'dark' ? 'bg-transparent border border-gray-700' : 'bg-white border border-gray-200'
      } ${className}`}
    >
      <StatusIcon className={`${statusConfig.color} text-sm`} />
      <span className={theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-700'}>{statusConfig.label}</span>
      {/* {showPulseOnActive && status === 'Active' && (
        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color.replace('text', 'bg')} animate-pulse`}></span>
      )} */}
    </div>
  );
};

export default StatusPill;