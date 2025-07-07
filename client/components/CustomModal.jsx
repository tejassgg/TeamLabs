import React from 'react';

const CustomModal = ({ isOpen, onClose, title, children, actions, getThemeClasses }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={getThemeClasses
        ? getThemeClasses(
            'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100',
            'dark:bg-gray-800 dark:border-gray-700'
          )
        : 'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100'}
      >
        {title && (
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <h3 className={getThemeClasses
              ? getThemeClasses('text-lg font-semibold', 'dark:text-gray-100')
              : 'text-lg font-semibold'}
            >
              {title}
            </h3>
          </div>
        )}
        <div className="mb-6">{children}</div>
        <div className="flex justify-end gap-3">
          {actions}
        </div>
      </div>
    </div>
  );
};

export default CustomModal; 