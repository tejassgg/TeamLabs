import { FaTimes, FaCheckCircle, FaClock, FaShieldAlt, FaRocket } from 'react-icons/fa';

// Task type styles and utilities
export const getTaskTypeStyle = (type) => {
  const styles = {
    'Bug': {
      bgColor: 'bg-gradient-to-r from-red-50 to-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 17V7.00001C8 5.20202 8 4.30302 8.43597 3.66606C8.81947 3.10068 9.40173 2.67724 10.0858 2.4636C10.8449 2.22222 11.7476 2.45386 13.553 2.91712L18.553 4.19381C19.6884 4.47175 20.2562 4.61072 20.628 4.9568C20.9552 5.26041 21.1613 5.66725 21.2204 6.10576C21.2873 6.61029 21.0513 7.19377 20.5794 8.36072C20.2881 9.05932 20 10.1937 20 11.5V13.5C20 14.8063 20.2881 15.9407 20.5794 16.6393C21.0513 17.8062 21.2873 18.3897 21.2204 18.8942C21.1613 19.3328 20.9552 19.7396 20.628 20.0432C20.2562 20.3893 19.6884 20.5283 18.553 20.8062L13.553 22.0829C11.7476 22.5461 10.8449 22.7778 10.0858 22.5364C9.40173 22.3228 8.81947 21.8993 8.43597 21.3339C8 20.697 8 19.798 8 18.0001V17ZM17 12H12M17.5 16H12M17.5 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    },
    'Feature': {
      bgColor: 'bg-gradient-to-r from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 19.0784L16.25 16.25M19.0784 4.99994L16.25 7.82838M4.92157 19.0784L7.75 16.25M4.92157 4.99994L7.75 7.82838" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    'Improvement': {
      bgColor: 'bg-gradient-to-r from-green-50 to-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 8V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    'Documentation': {
      bgColor: 'bg-gradient-to-r from-indigo-50 to-indigo-100',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    'Maintenance': {
      bgColor: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    'User Story': {
      bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.74" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    }
  };

  const defaultStyle = {
    bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100',
    textColor: 'text-gray-700', 
    borderColor: 'border-gray-200',
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  };

  return styles[type] || defaultStyle;
};

export const getTaskTypeBadge = (type) => {
  const style = getTaskTypeStyle(type);
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${style.bgColor} ${style.textColor} border ${style.borderColor} shadow-sm transition-all duration-200`}>
      {style.icon}
      {type || 'Task'}
    </span>
  );
};

// Priority styles and utilities
export const getPriorityStyle = (priority) => {
  const styles = {
    'High': {
      bgColor: 'bg-gradient-to-r from-red-50 to-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    'Medium': {
      bgColor: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    'Low': {
      bgColor: 'bg-gradient-to-r from-green-50 to-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    }
  };

  return styles[priority] || styles['Medium'];
};

export const getPriorityBadge = (priority) => {
  if (!priority) return null;
  
  const style = getPriorityStyle(priority);
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${style.bgColor} ${style.textColor} border ${style.borderColor} shadow-sm transition-all duration-200`}>
      {style.icon}
      {priority}
    </span>
  );
};

// Task status styles and utilities
export const getTaskStatusStyle = (statusCode, isDark = false) => {
  const styles = {
    1: { // Not Assigned
      bgColor: isDark ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50 to-gray-100',
      textColor: isDark ? 'text-gray-300' : 'text-gray-700',
      borderColor: isDark ? 'border-gray-700' : 'border-gray-200',
      icon: FaTimes,
      iconColor: isDark ? 'text-gray-400' : 'text-gray-500'
    },
    2: { // Assigned
      bgColor: isDark ? 'from-blue-900/50 to-blue-800/50' : 'from-blue-50 to-blue-100',
      textColor: isDark ? 'text-blue-300' : 'text-blue-700',
      borderColor: isDark ? 'border-blue-700' : 'border-blue-200',
      icon: FaCheckCircle,
      iconColor: isDark ? 'text-blue-400' : 'text-blue-500'
    },
    3: { // In Progress
      bgColor: isDark ? 'from-yellow-900/50 to-yellow-800/50' : 'from-yellow-50 to-yellow-100',
      textColor: isDark ? 'text-yellow-300' : 'text-yellow-700',
      borderColor: isDark ? 'border-yellow-700' : 'border-yellow-200',
      icon: FaClock,
      iconColor: isDark ? 'text-yellow-400' : 'text-yellow-500'
    },
    4: { // QA
      bgColor: isDark ? 'from-indigo-900/50 to-indigo-800/50' : 'from-indigo-50 to-indigo-100',
      textColor: isDark ? 'text-indigo-300' : 'text-indigo-700',
      borderColor: isDark ? 'border-indigo-700' : 'border-indigo-200',
      icon: FaShieldAlt,
      iconColor: isDark ? 'text-indigo-400' : 'text-indigo-500'
    },
    5: { // Deployment
      bgColor: isDark ? 'from-pink-900/50 to-pink-800/50' : 'from-pink-50 to-pink-100',
      textColor: isDark ? 'text-pink-300' : 'text-pink-700',
      borderColor: isDark ? 'border-pink-700' : 'border-pink-200',
      icon: FaRocket,
      iconColor: isDark ? 'text-pink-400' : 'text-pink-500'
    },
    6: { // Completed
      bgColor: isDark ? 'from-green-900/50 to-green-800/50' : 'from-green-50 to-green-100',
      textColor: isDark ? 'text-green-300' : 'text-green-700',
      borderColor: isDark ? 'border-green-700' : 'border-green-200',
      icon: FaCheckCircle,
      iconColor: isDark ? 'text-green-400' : 'text-green-500'
    }
  };

  return styles[statusCode] || styles[1]; // Default to Not Assigned if status not found
};

export const getTaskStatusBadge = (statusCode, isDark = false, statusText = null) => {
  if (!statusCode) return null;
  
  const style = getTaskStatusStyle(statusCode, isDark);
  const StatusIcon = style.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r ${style.bgColor} ${style.textColor} border ${style.borderColor}`}>
      <StatusIcon className={style.iconColor} size={12} />
      <span>{statusText || getTaskStatusText(statusCode)}</span>
    </span>
  );
};

// Helper function to get task status text
const getTaskStatusText = (statusCode) => {
  const statusMap = {
    1: 'Not Assigned',
    2: 'Assigned', 
    3: 'In Progress',
    4: 'QA',
    5: 'Deployment',
    6: 'Completed'
  };
  return statusMap[statusCode] || 'Unknown';
}; 