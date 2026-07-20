import { getStatusConfig } from '../dashboard/StatusConfig';

const StatusPill = ({ status, theme, className = '' }) => {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  if (!statusConfig) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200
      ${theme === 'dark'
        ? 'bg-dark-card border-dark-border text-gray-200 hover:bg-dark-hover'
        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
      } ${className}`}
    >
      <StatusIcon className={`${statusConfig.color} text-xs`} />
      <span>{statusConfig.label}</span>
    </div>
  );
};

export default StatusPill;