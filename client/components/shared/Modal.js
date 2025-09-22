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
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${theme === 'dark' ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-40'}`}>
      <div className={`rounded-xl shadow-lg p-6 relative w-full ${maxWidth} mx-4 animate-fadeIn transition-colors duration-300 ${theme === 'dark' ? 'bg-[#232323] text-white' : 'bg-white text-gray-900'}`}>
        {/* Header with centered title and close button */}
        <div className="mb-4">
          {title ? (
            <div className="flex">
              <div className="flex flex-col items-start w-[90%]">
                <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Welcome <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Back</span>
                </h1>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Sign in to your account to continue your journey
                </p>
                {/* <div className="mt-2 flex flex-wrap gap-4 justify-center">
                  <div className={`flex items-center px-3 py-2 rounded-lg ${theme === 'dark'
                    ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                    <span className="text-sm font-medium">✓ Secure Login</span>
                  </div>
                  <div className={`flex items-center px-3 py-2 rounded-lg ${theme === 'dark'
                    ? 'bg-green-900/30 text-green-300 border border-green-700'
                    : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                    <span className="text-sm font-medium">✓ Quick Access</span>
                  </div>
                </div> */}
              </div>
              <button className={`text-2xl transition-colors flex justify-end w-[10%] focus:outline-none ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`} onClick={onClose} aria-label="Close" >
                &times;
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                className={`text-2xl transition-colors focus:outline-none ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
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