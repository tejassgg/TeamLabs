import React, { useState, useEffect, useRef } from 'react';
import { FaPhone, FaPhoneSlash, FaBellSlash } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const IncomingCallScreen = ({ 
  isVisible, 
  callData, 
  onAnswer, 
  onDecline, 
  onClose 
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const autoDeclinedRef = useRef(false);

  // Timer for call duration
  useEffect(() => {
    if (isVisible) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(secs);
        if (secs >= 60 && !autoDeclinedRef.current) {
          autoDeclinedRef.current = true;
          onDecline && onDecline();
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setElapsedSeconds(0);
      autoDeclinedRef.current = false;
    }
  }, [isVisible, onDecline]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl border ${
        isDark ? 'border-gray-600' : 'border-gray-200'
      } overflow-hidden`}>
        {/* Header with caller info */}
        <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            {/* Caller avatar/icon */}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-blue-600' : 'bg-blue-500'
            } text-white`}>
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
              <h3 className={`font-semibold text-lg truncate ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {callerName}
              </h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-green-400 animate-pulse`}></div>
                <span className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Incoming call • {formatDuration(elapsedSeconds)}
                </span>
              </div>
            </div>

            {/* Silent button (replaces close X) */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl hover:bg-opacity-80 transition-colors text-2xl ${
                isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
              }`}
              title="Silence"
            >
              <FaBellSlash size={16} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
            </button>
          </div>
        </div>

        {/* Profile photo area */}
        <div className={`relative ${isDark ? 'bg-gray-900' : 'bg-gray-100'} h-36 flex items-center justify-center`}>
          {callerAvatar ? (
            <img
              src={callerAvatar}
              alt={callerName}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold ${
              isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-300 text-gray-700'
            }`}>
              {callerInitials}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 flex gap-3">
          {/* Decline button */}
          <button
            onClick={onDecline}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            title="Decline Call"
          >
            <FaPhoneSlash size={16} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
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
