import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { authService, meetingService } from '../../services/api';
import {
  FaGithub,
  FaCalendarAlt,
  FaVideo,
  FaGoogleDrive,
  FaDropbox,
  FaSlack,
  FaMicrosoft,
  FaEllipsisV,
  FaCog
} from 'react-icons/fa';
import { getIntegrationIcon, getIntegrationName } from '../../utils/integrationIcons';

const IntegrationsTab = ({ getThemeClasses }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    fetchIntegrationsStatus();
    handleIntegrationCallbacks();
  }, [user?._id]);

  // Handle GitHub and Google Calendar callbacks
  const handleIntegrationCallbacks = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const githubCode = urlParams.get('github_code');
    const googleCode = urlParams.get('google_code');
    const error = urlParams.get('error');

    // Handle GitHub callback
    if (githubCode || (code && state && localStorage.getItem('github_state') === state)) {
      const githubUserId = localStorage.getItem('github_userId');
      if (githubUserId === user._id) {
        authService.handleGitHubCallback(githubCode || code, state)
          .then(() => {
            showToast('GitHub account connected successfully!', 'success');
            fetchIntegrationsStatus();
            // Clean up URL
            const newUrl = window.location.pathname + '?tab=integrations';
            window.history.replaceState({}, '', newUrl);
          })
          .catch((error) => {
            console.error('GitHub callback error:', error);
            showToast('Failed to connect GitHub account', 'error');
          })
          .finally(() => {
            localStorage.removeItem('github_state');
            localStorage.removeItem('github_userId');
          });
      }
    }

    // Handle Google Calendar callback - check for success parameter
    if (urlParams.get('googleCalendar') === 'connected') {
      showToast('Google Calendar connected successfully!', 'success');
      fetchIntegrationsStatus();
      // Clean up URL
      const newUrl = window.location.pathname + '?tab=integrations';
      window.history.replaceState({}, '', newUrl);
    }

    // Handle Google Drive callback - check for success parameter
    if (urlParams.get('googleDrive') === 'connected') {
      showToast('Google Drive connected successfully!', 'success');
      fetchIntegrationsStatus();
      // Clean up URL
      const newUrl = window.location.pathname + '?tab=integrations';
      window.history.replaceState({}, '', newUrl);
    }

    // Handle OAuth errors
    if (error) {
      showToast(`Authentication failed: ${error}`, 'error');
      // Clean up URL
      const newUrl = window.location.pathname + '?tab=integrations';
      window.history.replaceState({}, '', newUrl);
    }
  };


  const fetchIntegrationsStatus = async () => {
    try {
      setLoading(true);
      const response = await authService.getIntegrationsStatus(user._id);
      if (response.success) {
        setIntegrations(response.integrations);
      }
    } catch (error) {
      console.error('Error fetching integrations status:', error);
      showToast('Failed to fetch integrations status', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get the appropriate icon component
  const getIconComponent = (iconName) => {
    const iconMap = {
      FaGithub: FaGithub,
      FaCalendarAlt: FaCalendarAlt,
      FaVideo: FaVideo,
      FaGoogleDrive: FaGoogleDrive,
      FaDropbox: FaDropbox,
      FaSlack: FaSlack,
      FaMicrosoft: FaMicrosoft
    };
    return iconMap[iconName] || FaGithub;
  };

  // Helper function to get icon color based on integration type
  const getIconColor = (integrationType) => {
    const colorMap = {
      github: '#333',
      google_calendar: '#4285F4',
      google_meet: '#00AC47',
      google_drive: '#4285F4',
      dropbox: '#0061FF',
      slack: '#4A154B',
      zoom: '#2D8CFF',
      microsoft_teams: '#6264A7',
      onedrive: '#0078D4',
      microsoft_outlook: '#0078D4'
    };
    return colorMap[integrationType] || '#6B7280';
  };

  // Handle integration toggle
  const handleIntegrationToggle = async (integration) => {
    try {
      setLoading(true);

      if (integration.connected) {
        // Disconnect integration
        if (integration.type === 'github') {
          await authService.disconnectGitHub(user._id);
          showToast('GitHub account disconnected successfully', 'success');
        } else if (integration.type === 'google_calendar') {
          await meetingService.disconnectGoogleCalendar();
          showToast('Google Calendar disconnected successfully', 'success');
        } else if (integration.type === 'google_drive') {
          await meetingService.disconnectGoogleDrive();
          showToast('Google Drive disconnected successfully', 'success');
        } else {
          showToast(`${integration.name} integration not yet implemented`, 'info');
          return;
        }
      } else {
        // Connect integration
        if (integration.type === 'github') {
          const response = await authService.initiateGitHubAuth(user._id);
          if (response.success) {
            localStorage.setItem('github_state', response.state);
            localStorage.setItem('github_userId', user._id);
            window.location.href = response.authUrl;
          } else {
            showToast(response.error || 'Failed to initiate GitHub authentication', 'error');
          }
          return; // Don't refresh status as we're redirecting
        } else if (integration.type === 'google_calendar' || integration.type === 'google_drive') {
          const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
          const response = await meetingService.initiateGoogleAuth(integration.type, currentUrl);
          if (response?.success && response?.authUrl) {
            window.location.href = response.authUrl;
          } else {
            showToast(`Failed to start ${integration.name} authorization`, 'error');
          }
          return; // Don't refresh status as we're redirecting
        } else {
          showToast(`${integration.name} integration not yet implemented`, 'info');
          return;
        }
      }

      // Refresh integrations status only if not redirecting
      await fetchIntegrationsStatus();
    } catch (error) {
      console.error('Error toggling integration:', error);
      showToast(`Failed to ${integration.connected ? 'disconnect' : 'connect'} ${integration.name}`, 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Integrations
        </h2>
        <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Connect your favorite tools and services to enhance your workflow
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme === 'dark' ? 'border-white' : 'border-gray-900'}`}></div>
          <span className={`ml-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading integrations...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {integrations.map((integration) => {
            const IconComponent = getIconComponent(integration.icon);
            const iconColor = getIconColor(integration.type);

            return (
              <div
                key={integration.id}
                className={`relative p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${theme === 'dark'
                  ? 'bg-transparent border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                  }`}
              >
                {/* Integration Icon */}
                <div className="flex justify-between">
                  <div className="rounded-lg flex items-center justify-center w-12 h-12" style={{ backgroundColor: `${iconColor}15` }} >
                    <IconComponent
                      size={24}
                      style={{ color: iconColor }}
                    />
                  </div>
                </div>

                {/* Integration Info */}
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {integration.name}
                  </h3>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {integration.description}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <button
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <FaCog size={14} />
                    Details
                  </button>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integration.connected}
                      onChange={() => handleIntegrationToggle(integration)}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className={`relative w-11 h-6 rounded-full peer transition-colors ${integration.connected
                      ? 'bg-green-600'
                      : theme === 'dark'
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                      } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800`}>
                      <div className={`absolute top-0.5 ${integration.connected ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'} bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform peer-checked:border-white`}></div>
                    </div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IntegrationsTab;


