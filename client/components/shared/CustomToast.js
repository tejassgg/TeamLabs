import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

// Fixed import path for component reorganization
const CustomToast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = 'fixed top-16 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out animate-slide-in';
    
    const typeStyles = {
      success: theme === 'dark' 
        ? 'bg-green-900/90 text-green-100 border border-green-800/50' 
        : 'bg-green-50 text-green-800 border border-green-200',
      error: theme === 'dark'
        ? 'bg-red-900/90 text-red-100 border border-red-800/50'
        : 'bg-red-50 text-red-800 border border-red-200',
      warning: theme === 'dark'
        ? 'bg-yellow-900/90 text-yellow-100 border border-yellow-800/50'
        : 'bg-yellow-50 text-yellow-800 border border-yellow-200',
      info: theme === 'dark'
        ? 'bg-blue-900/90 text-blue-100 border border-blue-800/50'
        : 'bg-blue-50 text-blue-800 border border-blue-200'
    };

    return `${baseStyles} ${typeStyles[type]}`;
  };

  const getIcon = () => {
    const iconProps = { size: 20 };
    switch (type) {
      case 'success':
        return <FaCheckCircle className="flex-shrink-0" {...iconProps} />;
      case 'error':
        return <FaExclamationCircle className="flex-shrink-0" {...iconProps} />;
      case 'warning':
        return <FaExclamationCircle className="flex-shrink-0" {...iconProps} />;
      case 'info':
        return <FaInfoCircle className="flex-shrink-0" {...iconProps} />;
      default:
        return <FaInfoCircle className="flex-shrink-0" {...iconProps} />;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className={`ml-2 p-1 rounded-full hover:bg-opacity-20 transition-colors duration-200 ${
          theme === 'dark' ? 'hover:bg-white/20' : 'hover:bg-black/10'
        }`}
      >
        <FaTimes size={14} />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 animate-progress" />
    </div>
  );
};

export default CustomToast;

// Add these styles to your global CSS or create a new style block
const styles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .animate-slide-in {
    animation: slideIn 0.5s ease-out forwards;
  }

  .animate-slide-out {
    animation: slideOut 0.5s ease-in forwards;
  }

  .animate-progress {
    animation: progress 5s linear forwards;
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
} 