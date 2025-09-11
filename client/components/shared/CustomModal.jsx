import React from 'react';

const CustomModal = ({ isOpen, onClose, title, children, actions, getThemeClasses }) => {
  if (!isOpen) return null;
  const containerClasses = getThemeClasses
    ? getThemeClasses(
        'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100',
        'dark:bg-[#18181b] dark:border-[#232323]'
      )
    : 'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100';

  const titleClasses = getThemeClasses
    ? getThemeClasses('text-lg font-semibold text-gray-900', 'text-lg font-semibold text-white')
    : 'text-lg font-semibold';

  const closeBtnClasses = getThemeClasses
    ? getThemeClasses('text-gray-400 hover:text-gray-600 text-xl font-bold', 'text-gray-400 hover:text-gray-300 text-xl font-bold')
    : 'text-gray-400 hover:text-gray-600 text-xl font-bold';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={containerClasses}>
        {(title || onClose) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {title && <h3 className={titleClasses}>{title}</h3>}
            </div>
            {onClose && (
              <button aria-label="Close" onClick={onClose} className={closeBtnClasses}>
                ×
              </button>
            )}
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