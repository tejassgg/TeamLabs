import { useState, useEffect, useRef } from 'react';
import { getStatusConfig } from '../dashboard/StatusConfig';

// Enhanced StatusDropdown component
const StatusDropdown = ({ isMobile, currentStatus, onStatusChange, theme, isReadOnly = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isChanging, setIsChanging] = useState(false);

  const statusTooltips = {
    'Active': 'Available and active',
    'In a Meeting': 'Currently in a meeting',
    'Presenting': 'Currently presenting',
    'Away': 'Away from keyboard',
    'Busy': 'Currently busy',
    'Offline': 'Currently offline'
  };

  const statusOptions = Object.keys(statusTooltips);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus) => {
    if (isReadOnly) return;
    
    setIsChanging(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setTimeout(() => setIsChanging(false), 500); // Reset after animation
    }
  };

  const currentConfig = getStatusConfig(currentStatus || 'Offline');
  const StatusIcon = currentConfig.icon;

  // For read-only display, just show the status without dropdown functionality
  if (isReadOnly) {
    return (
      <div className="flex items-center gap-2">
        <StatusIcon className={`${currentConfig.color} text-sm`} size={14} />
        <span className="text-sm font-medium">{currentStatus}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200
          hover:bg-blue-100 text-blue-600 dark:hover:bg-dark-hover dark:text-blue-200
          ${isChanging ? 'scale-95' : 'scale-100'}
          relative overflow-hidden`}
        title={statusTooltips[currentStatus]}
      >
        {/* Pulsing effect for Active status */}
        {currentStatus === 'Active' && (
          <span className="absolute inset-0 bg-green-500/10 rounded-lg animate-pulse"></span>
        )}
        <div className="relative flex items-center gap-2">
          <StatusIcon className={`${currentConfig.color} transition-transform duration-200 group-hover:scale-110`} size={14} />
          {!isMobile && (
            <>
              <span className="text-sm font-medium transition-all duration-200">{currentStatus}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </>
          )}
        </div>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg z-50 transform transition-all duration-200 origin-top-right
          bg-white border border-gray-200 dark:bg-dark-hover dark:border dark:border-[#2d2d2d]`}
        >
          <div className="py-1.5">
            {statusOptions.map((status) => {
              const optionConfig = getStatusConfig(status);
              const StatusOptionIcon = optionConfig.icon;
              return (
                <button
                  key={status}
                  onClick={() => {
                    handleStatusChange(status);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-all duration-200
                    hover:bg-gray-50 text-gray-700 dark:hover:bg-[#2d2d2d] dark:text-blue-200
                    ${currentStatus === status ? 'font-semibold' : ''}`}
                  title={statusTooltips[status]}
                >
                  <StatusOptionIcon className={optionConfig.color} size={14} />
                  <span>{status}</span>
                  {currentStatus === status && (
                    <span className="ml-auto text-xs text-gray-400">Current</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;