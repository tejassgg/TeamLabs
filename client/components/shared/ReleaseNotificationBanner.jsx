import React, { useState, useEffect } from 'react';

import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { releaseNotificationService } from '../../services/api';
import { 
  FaRocket, 
  FaTimes, 
  FaChevronDown,
  FaChevronUp,
  FaCalendar,
  FaUser,
  FaFlag,
  FaSpinner,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBug
} from 'react-icons/fa';

const ReleaseNotificationBanner = ({ onClose }) => {
  const { userDetails } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();
  
  const [latestRelease, setLatestRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissedReleases, setDismissedReleases] = useState(new Set());

  useEffect(() => {
    fetchLatestRelease();
    // Load dismissed releases from localStorage
    const dismissed = localStorage.getItem('dismissedReleases');
    if (dismissed) {
      setDismissedReleases(new Set(JSON.parse(dismissed)));
    }
  }, []);

  const fetchLatestRelease = async () => {
    try {
      setLoading(true);
      const response = await releaseNotificationService.getLatestReleaseNotification('all');
      if (response.success && response.data) {
        setLatestRelease(response.data);
      }
    } catch (error) {
      console.error('Error fetching latest release:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (latestRelease) {
      const newDismissed = new Set(dismissedReleases);
      newDismissed.add(latestRelease._id);
      setDismissedReleases(newDismissed);
      localStorage.setItem('dismissedReleases', JSON.stringify([...newDismissed]));
      onClose?.();
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'high':
        return <FaFlag className="text-orange-500" />;
      case 'medium':
        return <FaInfoCircle className="text-blue-500" />;
      case 'low':
        return <FaCheckCircle className="text-green-500" />;
      default:
        return <FaRocket className="text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'low':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getFeatureIcon = (type) => {
    switch (type) {
      case 'feature':
        return <FaCheckCircle className="text-green-500" />;
      case 'improvement':
        return <FaRocket className="text-blue-500" />;
      case 'bugfix':
        return <FaBug className="text-orange-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  // Don't show if loading, no release, or user dismissed this release
  if (loading || !latestRelease || dismissedReleases.has(latestRelease._id)) {
    return null;
  }

  // Check if release has expired
  if (latestRelease.expiresAt && new Date(latestRelease.expiresAt) < new Date()) {
    return null;
  }

  return (
    <div className={`relative border-l-4 ${getPriorityColor(latestRelease.priority)} ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    } shadow-lg`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getPriorityIcon(latestRelease.priority)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  New Release Available
                </h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                }`}>
                  v{latestRelease.version}
                </span>
              </div>
              <h4 className={`text-base font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {latestRelease.title}
              </h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {latestRelease.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600'
              }`}
            >
              {expanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
            </button>
            <button
              onClick={handleDismiss}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600'
              }`}
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        {/* Meta information */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <FaCalendar className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {new Date(latestRelease.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <FaUser className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {latestRelease.createdByName}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {expanded ? 'Show Less' : 'View Details'}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className={`border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="p-4 space-y-6">
            {/* Release Notes */}
            {latestRelease.releaseNotes && (
              <div>
                <h5 className={`font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Release Notes
                </h5>
                <div className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <p className={`text-sm whitespace-pre-wrap ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {latestRelease.releaseNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Features */}
            {latestRelease.features && latestRelease.features.length > 0 && (
              <div>
                <h5 className={`font-medium mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  New Features
                </h5>
                <div className="space-y-3">
                  {latestRelease.features.map((feature, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        {getFeatureIcon('feature')}
                        <div>
                          <h6 className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {feature.title}
                          </h6>
                          <p className={`text-sm mt-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {latestRelease.improvements && latestRelease.improvements.length > 0 && (
              <div>
                <h5 className={`font-medium mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Improvements
                </h5>
                <div className="space-y-3">
                  {latestRelease.improvements.map((improvement, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        {getFeatureIcon('improvement')}
                        <div>
                          <h6 className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {improvement.title}
                          </h6>
                          <p className={`text-sm mt-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {improvement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bug Fixes */}
            {latestRelease.bugFixes && latestRelease.bugFixes.length > 0 && (
              <div>
                <h5 className={`font-medium mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Bug Fixes
                </h5>
                <div className="space-y-3">
                  {latestRelease.bugFixes.map((bugFix, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        {getFeatureIcon('bugfix')}
                        <div>
                          <h6 className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {bugFix.title}
                          </h6>
                          <p className={`text-sm mt-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {bugFix.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            

            {/* Compatibility */}
            {latestRelease.compatibility && (
              <div>
                <h5 className={`font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Compatibility
                </h5>
                <div className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  {latestRelease.compatibility.minVersion && (
                    <p className={`text-sm mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <strong>Minimum Version:</strong> {latestRelease.compatibility.minVersion}
                    </p>
                  )}
                  {latestRelease.compatibility.maxVersion && (
                    <p className={`text-sm mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <strong>Maximum Version:</strong> {latestRelease.compatibility.maxVersion}
                    </p>
                  )}
                  {latestRelease.compatibility.supportedBrowsers && latestRelease.compatibility.supportedBrowsers.length > 0 && (
                    <p className={`text-sm mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <strong>Supported Browsers:</strong> {latestRelease.compatibility.supportedBrowsers.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleaseNotificationBanner;
