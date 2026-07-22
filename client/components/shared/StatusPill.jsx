import { getStatusConfig } from '../dashboard/StatusConfig';

const StatusPill = ({ status, theme, className = '' }) => {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  if (!statusConfig) return null;

  return (
    <div className={`inline-flex items-center gap-1 p-1 rounded-full text-xs font-semibold border transition-all duration-200
      bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-dark-card dark:border-dark-border dark:text-gray-200 dark:hover:bg-dark-hover ${className}`}
    >
      <StatusIcon className={`${statusConfig.color} m-1`} size={12} />
      <span className="mr-1">{statusConfig.label}</span>
    </div>
  );
};

export default StatusPill;