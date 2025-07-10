import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const Modal = ({ isOpen, onClose, children, title }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300">
      <div className={`rounded-xl shadow-lg p-6 relative w-full max-w-md mx-4 animate-fadeIn transition-colors duration-300 ${theme === 'dark' ? 'bg-[#232323] text-white' : 'bg-white text-gray-900'}`}>
        {/* Header with centered title and close button */}
        <div className="flex items-center justify-between mb-6">
          {title && (
            <h3 className="text-xl font-semibold flex-1">
              {title}
            </h3>
          )}
          <div className="flex-1 flex justify-end">
            <button
              className="text-2xl text-gray-400 hover:text-primary focus:outline-none transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
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