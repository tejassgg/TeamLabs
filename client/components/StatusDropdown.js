import { useState, useEffect, useRef } from 'react';
import {
  FaChevronDown,
  FaVideo,
  FaChalkboardTeacher,
  FaCoffee,
  FaPowerOff,
  FaCheckCircle,
  FaUserSlash
} from 'react-icons/fa';

// Enhanced StatusDropdown component
const StatusDropdown = ({ currentStatus, onStatusChange, theme, isReadOnly = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isChanging, setIsChanging] = useState(false);

  const statusConfig = {
    'Active': {
      color: 'text-green-500',
      icon: FaCheckCircle,
      tooltip: 'Available and active'
    },
    'In a Meeting': {
      color: 'text-blue-500',
      icon: FaVideo,
      tooltip: 'Currently in a meeting'
    },
    'Presenting': {
      color: 'text-purple-500',
      icon: FaChalkboardTeacher,
      tooltip: 'Currently presenting'
    },
    'Away': {
      color: 'text-yellow-500',
      icon: FaCoffee,
      tooltip: 'Away from keyboard'
    },
    'Busy': {
      color: 'text-red-500',
      icon: FaUserSlash,
      tooltip: 'Currently busy'
    },
    'Offline': {
      color: 'text-gray-500',
      icon: FaPowerOff,
      tooltip: 'Currently offline'
    }
  };

  const statusOptions = Object.keys(statusConfig);

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

  const StatusIcon = statusConfig[currentStatus]?.icon || FaPowerOff;

  // For read-only display, just show the status without dropdown functionality
  if (isReadOnly) {
    return (
      <div className="flex items-center gap-2">
        <StatusIcon className={`${statusConfig[currentStatus]?.color || 'text-gray-500'} text-sm`} />
        <span className="text-sm font-medium">{currentStatus}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200
          ${theme === 'dark'
            ? 'hover:bg-[#424242] text-blue-200'
            : 'hover:bg-blue-100 text-blue-600'}
          ${isChanging ? 'scale-95' : 'scale-100'}
          relative overflow-hidden`}
        title={statusConfig[currentStatus]?.tooltip}
      >
        {/* Pulsing effect for Active status */}
        {currentStatus === 'Active' && (
          <span className="absolute inset-0 bg-green-500/10 rounded-lg animate-pulse"></span>
        )}
        <div className="relative flex items-center gap-2">
          <StatusIcon className={`${statusConfig[currentStatus]?.color || 'text-gray-500'} text-sm transition-transform duration-200 group-hover:scale-110`} />
          <span className="text-sm font-medium transition-all duration-200">{currentStatus}</span>
          <FaChevronDown className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg z-50 transform transition-all duration-200 origin-top-right
          ${theme === 'dark' ? 'bg-[#424242] border border-[#2d2d2d]' : 'bg-white border border-gray-200'}`}
        >
          <div className="py-1.5">
            {statusOptions.map((status) => {
              const StatusOptionIcon = statusConfig[status].icon;
              return (
                <button
                  key={status}
                  onClick={() => {
                    handleStatusChange(status);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-all duration-200
                    ${theme === 'dark'
                      ? 'hover:bg-[#2d2d2d] text-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'}
                    ${currentStatus === status ? 'font-semibold' : ''}`}
                  title={statusConfig[status].tooltip}
                >
                  <StatusOptionIcon className={`${statusConfig[status].color} text-sm`} />
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