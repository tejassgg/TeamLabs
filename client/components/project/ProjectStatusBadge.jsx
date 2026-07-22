// Project status styles and utilities
export const getProjectStatusStyle = (statusCode) => {
  const styles = {
    1: { // Not Assigned
      bgColor: 'from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-200 dark:border-gray-750',
      dotColor: 'bg-gray-500 dark:bg-gray-400',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
      iconColor: 'text-gray-500 dark:text-gray-400'
    },
    2: { // Assigned
      bgColor: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-800',
      dotColor: 'bg-blue-500 dark:bg-blue-400',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      iconColor: 'text-blue-500 dark:text-blue-400'
    },
    3: { // In Progress
      bgColor: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      dotColor: 'bg-yellow-500 dark:bg-yellow-400',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      iconColor: 'text-yellow-500 dark:text-yellow-400'
    },
    4: { // QA
      bgColor: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-900/30',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      dotColor: 'bg-indigo-500 dark:bg-indigo-400',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      iconColor: 'text-indigo-500 dark:text-indigo-400'
    },
    5: { // Deployment
      bgColor: 'from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-900/30',
      textColor: 'text-pink-700 dark:text-pink-300',
      borderColor: 'border-pink-200 dark:border-pink-800',
      dotColor: 'bg-pink-500 dark:bg-pink-400',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4.5 16.5c-1.5 1.25-2.5 3-2.5 5.5 2.5 0 4.25-1 5.5-2.5L18.5 8 16 5.5 4.5 16.5z" />
          <path d="M12 12l9-9" />
          <path d="M9 15l-3-3" />
        </svg>
      ),
      iconColor: 'text-pink-500 dark:text-pink-400'
    },
    6: { // Completed
      bgColor: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/30',
      textColor: 'text-green-700 dark:text-green-300',
      borderColor: 'border-green-200 dark:border-green-800',
      dotColor: 'bg-green-500 dark:bg-green-400',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      iconColor: 'text-green-500 dark:text-green-400'
    }
  };

  return styles[statusCode] || styles[1]; // Default to Not Assigned if status not found
};

export const getProjectStatusBadge = (status, showTooltip = true) => {
  const statusStyle = getProjectStatusStyle(status.Code);
  const StatusIcon = statusStyle.icon;

  return (
    <div className="group relative inline-block">
      <span className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r ${statusStyle.bgColor} ${statusStyle.textColor} border ${statusStyle.borderColor}`}>
        <StatusIcon className={statusStyle.iconColor} size={14} />
        {status.Value}
      </span>
      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
          Project Status: {status.Value}
          <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}; 