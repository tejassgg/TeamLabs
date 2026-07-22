import React, { useState, useEffect, useRef } from 'react';
import { FaPhone, FaPhoneSlash, FaBellSlash } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const IncomingCallScreen = ({ 
  isVisible, 
  callData, 
  onAnswer, 
  onDecline, 
  onClose 
}) => {
  const [ringStartTime, setRingStartTime] = useState(null);
  const autoDeclinedRef = useRef(false);

  // Auto-decline timer (60 seconds)
  useEffect(() => {
    if (isVisible) {
      const startTime = Date.now();
      setRingStartTime(startTime);
      const timer = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        if (secs >= 60 && !autoDeclinedRef.current) {
          autoDeclinedRef.current = true;
          onDecline && onDecline();
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setRingStartTime(null);
      autoDeclinedRef.current = false;
    }
  }, [isVisible, onDecline]);



  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    const initials = `${first}${second}`.toUpperCase();
    return initials || 'U';
  };

  if (!isVisible || !callData) return null;

  const callerName = callData.callerName || 'Unknown Caller';
  const callerAvatar = callData.callerAvatar || null;
  const callerInitials = getInitials(callerName);

  return (
    <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out w-96">
      {/* Main call screen */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 overflow-hidden">
        {/* Header with caller info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            {/* Caller avatar/icon */}
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500 dark:bg-blue-600 text-white">
              {callerAvatar ? (
                <img 
                  src={callerAvatar} 
                  alt={callerName} 
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                callerInitials
              )}
            </div>
            
            {/* Caller details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-white">
                {callerName}
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Incoming call
                </span>
              </div>
            </div>

            {/* Silent button (replaces close X) */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-opacity-80 transition-colors text-2xl hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Silence"
            >
              <FaBellSlash size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Profile photo area */}
        <div className="relative bg-gray-100 dark:bg-gray-900 h-36 flex items-center justify-center">
          {callerAvatar ? (
            <img
              src={callerAvatar}
              alt={callerName}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              {callerInitials}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 flex gap-3">
          {/* Decline button */}
          <button
            onClick={() => {
              const ringDuration = ringStartTime ? Math.floor((Date.now() - ringStartTime) / 1000) : 0;
              onDecline && onDecline(ringDuration);
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            title="Decline Call"
          >
            <FaPhoneSlash size={16} />
            Reject
          </button>

          {/* Answer button */}
          <button
            onClick={onAnswer}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            title="Answer Call"
          >
            <FaPhone size={16} />
            Answer
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallScreen;
