import React, { useEffect } from 'react';
import { FaCheck, FaTimes, FaExclamation, FaInfo } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

// Fixed import path for component reorganization
const CustomToast = ({ message, type = 'success', onClose, duration = 3500, description, action, secondaryAction }) => {
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
    const baseStyles = 'relative z-50 flex items-start gap-4 p-5 pr-10 rounded-2xl shadow-xl border transition-all duration-500 ease-in-out animate-slide-in w-[420px] max-w-[95vw]';

    const typeStyles = {
      success: 'bg-gradient-to-r from-emerald-50 via-white to-white border-emerald-100 dark:from-[#0f291e] dark:to-[#18181b] dark:border-[#133d2b]',
      error: 'bg-gradient-to-r from-[#fff5f5] via-white to-white border-rose-100 dark:from-[#2c1318] dark:to-[#18181b] dark:border-[#441a22]',
      warning: 'bg-gradient-to-r from-amber-50 via-white to-white border-amber-100 dark:from-[#292211] dark:to-[#18181b] dark:border-[#3f3214]',
      info: 'bg-gradient-to-r from-blue-50 via-white to-white border-blue-100 dark:from-[#112235] dark:to-[#18181b] dark:border-[#163050]'
    };

    return `${baseStyles} ${typeStyles[type]}`;
  };

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200 dark:shadow-none">
            <FaCheck size={11} className="stroke-[2]" />
          </div>
        );
      case 'error':
        return (
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-rose-600 dark:bg-rose-500 flex items-center justify-center text-white shadow-sm shadow-rose-200 dark:shadow-none">
            <FaTimes size={10} />
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-500 dark:bg-amber-400 flex items-center justify-center text-white shadow-sm shadow-amber-200 dark:shadow-none">
            <FaExclamation size={12} />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-sm shadow-blue-200 dark:shadow-none">
            <FaInfo size={10} />
          </div>
        );
    }
  };

  return (
    <div className={getToastStyles()}>
      {renderIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50 leading-snug break-words">
          {message}
        </h4>
        
        {description && (
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed break-words">
            {description}
          </p>
        )}

        {(action || secondaryAction) && (
          <div className="flex items-center gap-4 mt-3">
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {action.label}
              </button>
            )}
            {secondaryAction ? (
              <button
                onClick={() => {
                  secondaryAction.onClick();
                  onClose();
                }}
                className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                {secondaryAction.label}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
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