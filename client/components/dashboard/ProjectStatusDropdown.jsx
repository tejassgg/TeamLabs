import { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import { getProjectStatusBadge } from '../project/ProjectStatusBadge';

const ProjectStatusDropdown = ({ 
  currentStatus, 
  availableStatuses, 
  onStatusChange, 
  projectId, 
  theme,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusSelect = async (status) => {
    if (status.Code === selectedStatus.Code || isUpdating || disabled) {
      return;
    }

    setIsUpdating(true);
    try {
      await onStatusChange(projectId, status.Code);
      setSelectedStatus(status);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update project status:', error);
      // Revert to original status on error
      setSelectedStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all duration-200 ${
          disabled || isUpdating
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        } ${
          theme === 'dark'
            ? 'text-[#F3F6FA]'
            : 'text-gray-900 '
        }`}
      >
        <div className="flex items-center gap-2">
          {getProjectStatusBadge(selectedStatus, false)}
        </div>
        <FaChevronDown 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-400'
          }`} 
          size={12} 
        />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border shadow-lg ${
          theme === 'dark' 
            ? 'bg-[#232323] border-[#424242]' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-1 max-h-60 overflow-y-auto">
            {availableStatuses.map((status) => (
              <button
                key={status.Code}
                onClick={() => handleStatusSelect(status)}
                disabled={isUpdating}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors duration-150 ${
                  status.Code === selectedStatus.Code
                    ? theme === 'dark'
                      ? 'bg-blue-900 text-blue-200'
                      : 'bg-blue-50 text-blue-700'
                    : theme === 'dark'
                      ? 'hover:bg-[#2A2A2A] text-[#F3F6FA]'
                      : 'hover:bg-gray-50 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getProjectStatusBadge(status, false)}
                </div>
                {status.Code === selectedStatus.Code && (
                  <FaCheck 
                    className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} 
                    size={12} 
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {isUpdating && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-lg ${
          theme === 'dark' ? 'bg-[#232323]/80' : 'bg-white/80'
        }`}>
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatusDropdown; 