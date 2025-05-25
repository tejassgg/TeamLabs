import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomToast from '../components/CustomToast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    // Add slide-out animation before removing
    const toastElement = document.querySelector(`[data-toast-id="${id}"]`);
    if (toastElement) {
      toastElement.classList.add('animate-slide-out');
      // Wait for animation to complete before removing
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 500); // Match this with the slide-out animation duration
    } else {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-16 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} data-toast-id={toast.id}>
            <CustomToast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 