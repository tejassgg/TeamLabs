import commonTypes from '../../data/commonTypes.json';

export const statusMap = commonTypes
  .filter(item => item.MasterType === 'TaskStatus')
  .reduce((acc, item) => {
    acc[item.Code] = item.Value;
    return acc;
  }, {});

export const priorityMap = commonTypes
  .filter(item => item.MasterType === 'PriorityType')
  .reduce((acc, item) => {
    acc[item.Code] = item.Value;
    return acc;
  }, {});

// Task type styles and utilities
export const getTaskTypeStyle = (type) => {
  const styles = {
    'Bug': {
      bgColor: 'bg-gradient-to-r from-red-50 to-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="8" height="14" x="8" y="6" rx="4" />
          <path d="m19 7-3 2M5 7l3 2m11 4h-4M5 13h4m10 4-3-2M5 17l3-2M12 20v2M12 3v3" />
        </svg>
      )
    },
    'Feature': {
      bgColor: 'bg-gradient-to-r from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      )
    },
    'Improvement': {
      bgColor: 'bg-gradient-to-r from-green-50 to-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      )
    },
    'Documentation': {
      bgColor: 'bg-gradient-to-r from-indigo-50 to-indigo-100',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    },
    'Maintenance': {
      bgColor: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      )
    },
    'User Story': {
      bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10M6 10h10" />
        </svg>
      )
    },
    'Support': {
      bgColor: 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/40',
      textColor: 'text-orange-700 dark:text-orange-300',
      borderColor: 'border-orange-200 dark:border-orange-800/60',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
          <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
          <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
          <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
        </svg>
      )
    }
  };

  const defaultStyle = {
    bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    )
  };

  return styles[type] || defaultStyle;
};

export const getTaskTypeBadge = (type) => {
  const style = getTaskTypeStyle(type);

  return (
    <span className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-medium ${style.bgColor} ${style.textColor} border ${style.borderColor} shadow-sm transition-all duration-200`}>
      {style.icon}
      {type || 'Task'}
    </span>
  );
};

// Priority styles and utilities
export const getPriorityStyle = (priority) => {
  let norm = priority;
  if (priorityMap[priority] !== undefined) {
    norm = priorityMap[priority];
  }

  const styles = {
    'Critical': {
      bgColor: 'bg-gradient-to-r from-purple-50 to-rose-100 dark:from-rose-950/40 dark:to-purple-900/40',
      textColor: 'text-purple-600 dark:text-purple-400 font-bold',
      borderColor: 'border-purple-200 dark:border-purple-800',
      icon: <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    },
    'High': {
      bgColor: 'bg-gradient-to-r from-red-50 to-red-100',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    },
    'Medium': {
      bgColor: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-500',
      borderColor: 'border-yellow-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    },
    'Low': {
      bgColor: 'bg-gradient-to-r from-green-50 to-green-100',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    }
  };

  return styles[norm] || styles['Medium'];
};

export const getPriorityBadge = (priority) => {
  if (priority === undefined || priority === null || priority === '') return null;

  const label = priorityMap[priority] || priority;
  const style = getPriorityStyle(priority);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.textColor}`}>
      {style.icon}
      {label}
    </span>
  );
};

// Task status styles and utilities
export const getTaskStatusStyle = (statusCode) => {
  const styles = {
    1: { // Not Assigned
      bgColor: 'from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-200 dark:border-gray-700',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )
    },
    2: { // Assigned
      bgColor: 'from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-700',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    },
    3: { // In Progress
      bgColor: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/50 dark:to-yellow-800/50',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      borderColor: 'border-yellow-200 dark:border-yellow-700',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 dark:text-yellow-400 animate-spin-slow">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    4: { // QA
      bgColor: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      borderColor: 'border-indigo-200 dark:border-indigo-700',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 dark:text-indigo-400">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    5: { // Deployment
      bgColor: 'from-pink-50 to-pink-100 dark:from-pink-900/50 dark:to-pink-800/50',
      textColor: 'text-pink-700 dark:text-pink-300',
      borderColor: 'border-pink-200 dark:border-pink-700',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500 dark:text-pink-400">
          <path d="M4.5 16.5c-1.5 1.25-2.5 3-2.5 5.5 2.5 0 4.25-1 5.5-2.5L18.5 8 16 5.5 4.5 16.5z" />
          <path d="M12 12l9-9" />
          <path d="M9 15l-3-3" />
        </svg>
      )
    },
    6: { // Completed
      bgColor: 'from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50',
      textColor: 'text-green-700 dark:text-green-300',
      borderColor: 'border-green-200 dark:border-green-700',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 dark:text-green-400">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    }
  };

  return styles[statusCode] || styles[1]; // Default to Not Assigned if status not found
};

export const getTaskStatusLabel = (statusCode) => {
  return statusMap[statusCode] || 'Unknown';
};

export const getTaskStatusBadge = (statusCode, statusText = null) => {
  if (!statusCode) return null;

  const style = getTaskStatusStyle(statusCode);
  const labelText = statusText || getTaskStatusLabel(statusCode);

  return (
    <span className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r ${style.bgColor} ${style.textColor} border ${style.borderColor}`}>
      {style.icon}
      <span>{labelText}</span>
    </span>
  );
};
