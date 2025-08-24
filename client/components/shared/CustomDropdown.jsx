import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

const CustomDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  className = '',
  size = 'md', // 'sm', 'md', 'lg'
  variant = 'default', // 'default', 'outlined', 'filled'
  showSearch = false,
  searchPlaceholder = 'Search...',
  renderOption = null, // Custom render function for options
  renderSelected = null, // Custom render function for selected value
  icon = null, // Icon to show in the dropdown button
  rightIcon = null, // Icon to show on the right side
  maxHeight = 'max-h-60', // Max height for dropdown options
  width = 'w-full', // Width of the dropdown
  error = false, // Show error state
  errorMessage = '', // Error message to display
  label = '', // Label above the dropdown
  helpText = '', // Help text below the dropdown
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const { theme } = useTheme();

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  // Variant classes
  const variantClasses = {
    default: theme === 'dark' 
      ? 'bg-[#232323] border-gray-600 text-gray-100 hover:bg-[#2A2A2A]' 
      : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50',
    outlined: theme === 'dark'
      ? 'bg-transparent border-gray-600 text-gray-100 hover:bg-[#2A2A2A]'
      : 'bg-transparent border-gray-300 text-gray-900 hover:bg-gray-50',
    filled: theme === 'dark'
      ? 'bg-[#2A2A2A] border-gray-600 text-gray-100 hover:bg-[#323232]'
      : 'bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200'
  };

  // Theme-aware classes
  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;
  };

  // Filter options based on search query
  const filteredOptions = showSearch 
    ? options.filter(option => {
        const label = typeof option === 'object' ? option.label || option.name || option.text : String(option);
        return label.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;

  // Get selected option
  const selectedOption = options.find(option => {
    const optionValue = typeof option === 'object' ? option.value || option.id : option;
    return optionValue === value;
  });

  // Handle option selection
  const handleSelect = (option) => {
    const optionValue = typeof option === 'object' ? option.value || option.id : option;
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle click outside to close dropdown
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

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Render option content
  const renderOptionContent = (option) => {
    if (renderOption) {
      return renderOption(option);
    }
    
    if (typeof option === 'object') {
      return (
        <div className="flex items-center gap-3">
          {option.icon && (
            <span className="flex-shrink-0 text-gray-500 dark:text-gray-400">
              {option.icon}
            </span>
          )}
          <span className="flex-1">{option.label || option.name || option.text}</span>
          {option.description && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {option.description}
            </span>
          )}
        </div>
      );
    }
    
    return String(option);
  };

  // Render selected value
  const renderSelectedValue = () => {
    if (renderSelected) {
      return renderSelected(selectedOption);
    }
    
    if (selectedOption) {
      if (typeof selectedOption === 'object') {
        return (
          <div className="flex items-center gap-2">
            {selectedOption.icon && (
              <span className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                {selectedOption.icon}
              </span>
            )}
            <span className="truncate">{selectedOption.label || selectedOption.name || selectedOption.text}</span>
          </div>
        );
      }
      return String(selectedOption);
    }
    
    return (
      <span className={getThemeClasses('text-gray-500', 'dark:text-gray-400')}>
        {placeholder}
      </span>
    );
  };

  return (
    <div className={`relative ${width} ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className={getThemeClasses(
          'block text-sm font-medium mb-2 text-gray-700',
          'dark:text-gray-300'
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          w-full rounded-xl border transition-all duration-200
          flex items-center justify-between gap-2
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${label}-label` : undefined}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="truncate">{renderSelectedValue()}</span>
        </div>
        
        {rightIcon ? (
          <span className="flex-shrink-0">{rightIcon}</span>
        ) : (
          <svg 
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            } ${getThemeClasses('text-gray-400', 'dark:text-gray-500')}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className={`
          absolute z-50 w-full mt-2 rounded-xl shadow-lg overflow-hidden
          ${getThemeClasses(
            'bg-white border border-gray-200',
            'dark:bg-[#232323] dark:border-gray-600'
          )}
        `}>
          {/* Search Input */}
          {showSearch && (
            <div className={getThemeClasses(
              'p-3 border-b border-gray-200',
              'dark:border-gray-600'
            )}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={`
                  w-full px-3 py-2 rounded-lg border transition-colors
                  ${getThemeClasses(
                    'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    'dark:bg-[#2A2A2A] dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400'
                  )}
                `}
                autoFocus
              />
            </div>
          )}

          {/* Options List */}
          <div className={`${maxHeight} overflow-y-auto`}>
            {filteredOptions.length === 0 ? (
              <div className={getThemeClasses(
                'px-4 py-3 text-center text-gray-500',
                'dark:text-gray-400'
              )}>
                {showSearch && searchQuery ? 'No results found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value || option.id : option;
                const isSelected = optionValue === value;
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-4 py-3 text-left transition-colors duration-150
                      ${getThemeClasses(
                        'hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl',
                        'dark:hover:bg-gray-700'
                      )}
                      ${isSelected ? getThemeClasses(
                        'bg-blue-50 text-blue-700',
                        'dark:bg-blue-900/30 dark:text-blue-300'
                      ) : ''}
                    `}
                  >
                    {renderOptionContent(option)}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <p className={getThemeClasses(
          'mt-1 text-sm text-gray-500',
          'dark:text-gray-400'
        )}>
          {helpText}
        </p>
      )}
    </div>
  );
};

export default CustomDropdown;
