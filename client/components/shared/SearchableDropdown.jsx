import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaChevronDown } from 'react-icons/fa';

const SearchableDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  width = 'w-full',
  className = '',
  renderOption = null,
  renderSelected = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const { theme } = useTheme();

  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;
  };

  // Get option value safely
  const getOptionValue = (option) => {
    if (typeof option === 'object' && option !== null) {
      return option.value !== undefined ? option.value : option.id;
    }
    return option;
  };

  const getOptionLabel = (option) => {
    if (typeof option === 'object' && option !== null) {
      return option.label || option.name || option.text;
    }
    return String(option);
  };

  // Find selected option
  const selectedOption = options.find(opt => getOptionValue(opt) === value);
  const displayLabel = selectedOption ? getOptionLabel(selectedOption) : placeholder;

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option);
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelect = (option) => {
    onChange(getOptionValue(option));
    setIsOpen(false);
    setSearchQuery('');
  };

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${width} ${className}`} ref={dropdownRef}>
      {/* Dropdown Input / Display Button */}
      <div
        onClick={() => !isOpen && setIsOpen(true)}
        className={getThemeClasses(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-transparent',
          'dark:bg-[#2A2A2A] dark:hover:bg-[#323232] dark:text-gray-100'
        )}
      >
        <div className="flex-1 min-w-0">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={displayLabel}
              onClick={(e) => e.stopPropagation()} // Prevent closing
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm font-medium placeholder-gray-400 dark:placeholder-gray-500"
            />
          ) : (
            <span className="truncate block">
              {renderSelected && selectedOption ? renderSelected(selectedOption) : displayLabel}
            </span>
          )}
        </div>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex-shrink-0 cursor-pointer"
        >
          <FaChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}
          />
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          className={getThemeClasses(
            'absolute z-[9999] w-full mt-2 rounded-xl shadow-lg border border-gray-200 bg-white max-h-60 overflow-y-auto py-1',
            'dark:bg-dark-card dark:border-gray-600'
          )}
        >
          {filteredOptions.length === 0 ? (
            <div className={getThemeClasses('px-4 py-3 text-center text-gray-500', 'dark:text-gray-400')}>
              No results found
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const optionValue = getOptionValue(option);
              const isSelected = optionValue === value;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm font-medium transition-colors duration-150 block truncate
                    ${getThemeClasses('hover:bg-gray-50 text-gray-900', 'dark:hover:bg-dark-hover dark:text-gray-100')}
                    ${isSelected ? getThemeClasses('bg-blue-50 text-blue-700', 'dark:bg-blue-900/30 dark:text-blue-300') : ''}
                  `}
                >
                  {renderOption ? renderOption(option) : getOptionLabel(option)}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
