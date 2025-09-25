import { FaTimes, FaCheckCircle, FaClock, FaShieldAlt, FaRocket } from 'react-icons/fa';

// Project status styles and utilities
export const getProjectStatusStyle = (statusCode) => {
  const styles = {
    1: { // Not Assigned
      bgColor: 'from-gray-50 to-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
      dotColor: 'bg-gray-500',
      icon: FaTimes,
      iconColor: 'text-gray-500'
    },
    2: { // Assigned
      bgColor: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      dotColor: 'bg-blue-500',
      icon: FaCheckCircle,
      iconColor: 'text-blue-500'
    },
    3: { // In Progress
      bgColor: 'from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      dotColor: 'bg-yellow-500',
      icon: FaClock,
      iconColor: 'text-yellow-500'
    },
    4: { // QA
      bgColor: 'from-indigo-50 to-indigo-100',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      dotColor: 'bg-indigo-500',
      icon: FaShieldAlt,
      iconColor: 'text-indigo-500'
    },
    5: { // Deployment
      bgColor: 'from-pink-50 to-pink-100',
      textColor: 'text-pink-700',
      borderColor: 'border-pink-200',
      dotColor: 'bg-pink-500',
      icon: FaRocket,
      iconColor: 'text-pink-500'
    },
    6: { // Completed
      bgColor: 'from-green-50 to-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      dotColor: 'bg-green-500',
      icon: FaCheckCircle,
      iconColor: 'text-green-500'
    }
  };

  return styles[statusCode] || styles[1]; // Default to Not Assigned if status not found
};

export const getProjectStatusBadge = (status, showTooltip = true) => {
  const statusStyle = getProjectStatusStyle(status.Code);
  const StatusIcon = statusStyle.icon;
  
  return (
    <div className="group relative inline-block">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r ${statusStyle.bgColor} ${statusStyle.textColor} border ${statusStyle.borderColor}`}>
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