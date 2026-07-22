import React from 'react';

const CustomModal = ({ isOpen, onClose, title, children, actions, maxWidthClass = 'max-w-md' }) => {
  if (!isOpen) return null;
  const containerClasses = `bg-white dark:bg-dark-bg rounded-xl p-6 ${maxWidthClass} w-full mx-4 shadow-lg border border-gray-100 dark:border-dark-card`;
  const titleClasses = 'text-lg font-semibold text-gray-900 dark:text-white';
  const closeBtnClasses = 'text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-xl font-bold';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
        <div className="mb-3">{children}</div>
        <div className="flex justify-end gap-3">
          {actions}
        </div>
      </div>
    </div>
  );
};

export default CustomModal; 