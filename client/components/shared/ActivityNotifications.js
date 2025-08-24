import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/api';
import { 
  FaSignInAlt, 
  FaSignOutAlt, 
  FaUserEdit, 
  FaTimesCircle, 
  FaGoogle, 
  FaHistory,
  FaUserPlus,
  FaUserMinus,
  FaProjectDiagram,
  FaTasks,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaChevronRight
} from 'react-icons/fa';
import Link from 'next/link';

const ActivityNotifications = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await authService.getUserActivities(1, 10);
      setActivities(response.activities);
      setError(null);
    } catch (err) {
      setError('Failed to fetch activities');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activity) => {
    const iconProps = { size: 16 };
    
    switch (activity.type) {
      case 'login':
        return activity.loginMethod === 'google' ? (
          <FaGoogle className="text-blue-500" {...iconProps} />
        ) : (
          <FaSignInAlt className="text-green-500" {...iconProps} />
        );
      case 'logout':
        return <FaSignOutAlt className="text-red-500" {...iconProps} />;
      case 'login_failed':
        return <FaTimesCircle className="text-red-500" {...iconProps} />;
      case 'profile_update':
        return <FaUserEdit className="text-blue-500" {...iconProps} />;
      case 'team_join':
        return <FaUserPlus className="text-green-500" {...iconProps} />;
      case 'team_leave':
        return <FaUserMinus className="text-red-500" {...iconProps} />;
      case 'project_create':
      case 'project_update':
        return <FaProjectDiagram className="text-purple-500" {...iconProps} />;
      case 'task_create':
      case 'task_update':
        return <FaTasks className="text-yellow-500" {...iconProps} />;
      case 'task_complete':
        return <FaCheckCircle className="text-green-500" {...iconProps} />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500" {...iconProps} />;
      default:
        return <FaInfoCircle className="text-gray-500" {...iconProps} />;
    }
  };

  const getActivityTitle = (activity) => {
    const baseTitle = activity.type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    switch (activity.type) {
      case 'login':
        return activity.loginMethod === 'google' 
          ? 'Signed in with Google' 
          : 'Signed in with Email';
      case 'login_failed':
        return activity.loginMethod === 'google'
          ? 'Google Sign-in Failed'
          : 'Sign-in Failed';
      case 'profile_update':
        return 'Profile Updated';
      case 'team_join':
        return 'Joined Team';
      case 'team_leave':
        return 'Left Team';
      case 'project_create':
        return 'Created Project';
      case 'project_update':
        return 'Updated Project';
      case 'task_create':
        return 'Created Task';
      case 'task_update':
        return 'Updated Task';
      case 'task_complete':
        return 'Completed Task';
      case 'error':
        return 'Error Occurred';
      default:
        return baseTitle;
    }
  };

  const getActivityStatus = (activity) => {
    switch (activity.status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`absolute right-0 mt-2 w-96 rounded-xl shadow-lg py-1 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    } ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}>
      <div className={`px-4 py-2 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Recent Activities
          </h3>
          <Link 
            href="/profile?tab=activity"
            className={`text-xs font-medium flex items-center ${
              theme === 'dark' 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-500'
            } transition-colors duration-200`}
          >
            View All
            <FaChevronRight className="ml-1" size={12} />
          </Link>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className={`px-4 py-3 text-sm ${
            theme === 'dark' ? 'text-red-400' : 'text-red-600'
          } flex items-center justify-center`}>
            <FaExclamationTriangle className="mr-2" />
            {error}
          </div>
        ) : activities.length === 0 ? (
          <div className={`px-4 py-6 text-sm text-center ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <FaHistory className="mx-auto mb-2 text-gray-400" size={20} />
            <p>No recent activities</p>
          </div>
        ) : (
          <div>
            {activities.map((activity) => (
              <div
                key={activity._id}
                className={`px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-md ${
                    theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    {getActivityIcon(activity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {getActivityTitle(activity)}
                      </p>
                      <span className={`text-xs ${getActivityStatus(activity)}`}>
                        {activity.status === 'success' && 'Success'}
                        {activity.status === 'error' && 'Error'}
                        {activity.status === 'warning' && 'Warning'}
                      </span>
                    </div>
                    {activity.details && (
                      <p className={`text-xs mt-0.5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      } line-clamp-1`}>
                        {activity.details}
                      </p>
                    )}
                    <div className="flex items-center mt-1">
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityNotifications; 