import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const Modal = ({ isOpen, onClose, children, title, maxWidth = 'max-w-md' }) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 bg-black/40`}>
      <div className={`rounded-xl shadow-lg p-6 relative w-full ${maxWidth} mx-4 animate-fadeIn transition-colors duration-300 bg-white text-gray-900 dark:bg-dark-bg dark:text-white dark:border dark:border-dark-card`}>
        {/* Header with centered title and close button */}
        <div className="mb-4">
          {title ? (
            <div className="flex">
              <div className="flex flex-col items-start w-[90%]">
                <p className={`text-3xl font-bold text-black dark:text-white`}>
                  {title}
                </p>
              </div>
              <button className={`text-2xl transition-colors flex justify-end w-[10%] focus:outline-none text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200`} onClick={onClose} aria-label="Close" >
                &times;
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                className={`text-2xl transition-colors focus:outline-none text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200`}
                onClick={onClose}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          )}
        </div>
        {children}
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};

export default Modal; 