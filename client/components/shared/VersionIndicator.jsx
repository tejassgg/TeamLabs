import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CLIENT_VERSION } from '../../config/version';
import { FaRocket, FaArrowUp, FaInfo } from 'react-icons/fa';

const VersionIndicator = ({ versionUpdateAvailable, latestVersion, onClick }) => {
  const { theme } = useTheme();

  if (!versionUpdateAvailable) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
      }`}
      title={`Update available: v${latestVersion}`}
    >
      <FaRocket size={12} />
      <span className="hidden sm:inline">Update Available</span>
      <span className="sm:hidden">Update</span>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
    </button>
  );
};

export const VersionBadge = ({ version, isLatest = false }) => {
  const { theme } = useTheme();

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isLatest 
        ? (theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
        : (theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800')
    }`}>
      <FaInfo size={8} />
      <span>v{version}</span>
      {isLatest && (
        <FaArrowUp size={8} className="text-green-500" />
      )}
    </div>
  );
};

export const CurrentVersionInfo = () => {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
    }`}>
      <span>Current: v{CLIENT_VERSION}</span>
    </div>
  );
};

export default VersionIndicator;
