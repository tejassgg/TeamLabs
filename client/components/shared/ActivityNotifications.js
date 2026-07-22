import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../../context/ThemeContext';
import { authService, notificationInboxService } from '../../services/api';
import { subscribe } from '../../services/socket';
import { useGlobal } from '../../context/GlobalContext';
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
  FaBell,
  FaTag,
  FaEnvelopeOpen,
  FaComment
} from 'react-icons/fa';
import useSWR from 'swr';
import { sendBrowserNotification } from '../../utils/browserNotifications';

const ActivityNotifications = ({ isOpen, onClose, onUnreadCountChange }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { userDetails } = useGlobal();
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'activities'

  const {
    data: notifications = [],
    error: notificationsError,
    mutate: mutateNotifications,
    isValidating: notificationsLoading
  } = useSWR(
    userDetails ? 'notifications' : null,
    () => notificationInboxService.getNotifications().then(res => res || [])
  );

  const {
    data: activities = [],
    error: activitiesError,
    mutate: mutateActivities,
    isValidating: activitiesLoading
  } = useSWR(
    userDetails && isOpen ? 'activities' : null,
    () => authService.getUserActivities(1, 20).then(res => res.activities || [])
  );

  const error = notificationsError || activitiesError;

  // Load notifications and activities on mount/user change
  useEffect(() => {
    if (userDetails) {
      // Subscribe to real-time notification socket events
      const unsubscribe = subscribe('notification:new', (payload) => {
        const newNoti = payload.data;
        if (newNoti) {
          mutateNotifications((prev = []) => {
            const updated = [newNoti, ...prev];
            return updated;
          }, false);

          // Trigger browser notification for task assignment
          if (newNoti.Type === 'assignment') {
            sendBrowserNotification(newNoti.Title, {
              body: newNoti.Body,
              icon: '/static/logo.png',
              tag: `noti-${newNoti.NotificationID || newNoti._id || 'assignment'}`,
              data: { link: newNoti.Link }
            });
          }
        }
      });

      return () => unsubscribe();
    }
  }, [userDetails, mutateNotifications]);

  // Sync unread count whenever notifications state changes
  useEffect(() => {
    const unread = notifications.filter(n => !n.IsRead).length;
    if (onUnreadCountChange) onUnreadCountChange(unread);
  }, [notifications, onUnreadCountChange]);


  const handleMarkAllRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.IsRead).map(n => n.NotificationID);
      if (unreadIds.length === 0) return;

      await notificationInboxService.markAsRead(unreadIds);
      mutateNotifications(prev => prev.map(n => ({ ...n, IsRead: true })), false);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (noti) => {
    try {
      if (!noti.IsRead) {
        await notificationInboxService.markAsRead([noti.NotificationID]);
        mutateNotifications(prev => prev.map(n =>
          n.NotificationID === noti.NotificationID ? { ...n, IsRead: true } : n
        ), false);
      }
      onClose();
      if (noti.Link) {
        router.push(noti.Link);
      }
    } catch (err) {
      console.error('Failed processing notification click:', err);
    }
  };

  const getNotiIcon = (type) => {
    const iconProps = { size: 16 };
    switch (type) {
      case 'mention':
        return <FaTag className="text-purple-500" {...iconProps} />;
      case 'assignment':
        return <FaTasks className="text-blue-500" {...iconProps} />;
      case 'comment':
        return <FaComment className="text-yellow-500" {...iconProps} />;
      case 'status_change':
        return <FaHistory className="text-green-500" {...iconProps} />;
      default:
        return <FaBell className="text-gray-500" {...iconProps} />;
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
        return 'text-gray-500 dark:text-gray-400';
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

  const currentLoading = activeTab === 'inbox' ? notificationsLoading : activitiesLoading;

  return (
    <div className="absolute top-12 right-[-60px] sm:right-0 w-[100vw] sm:w-96 rounded-2xl shadow-xl py-1 border z-50 transition-all duration-200 bg-white/100 text-gray-900 border-slate-200/80 shadow-slate-200/40 backdrop-blur-md dark:bg-dark-bg/100 dark:text-white dark:border-dark-border dark:shadow-none dark:backdrop-blur-md focus:outline-none">

      {/* Header and Tabs */}
      <div className={`px-4 py-2 border-b border-slate-100 dark:border-dark-border`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`text-sm font-semibold pb-1 border-b-2 transition-all duration-200 ${activeTab === 'inbox'
                ? 'border-primary text-primary dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                }`}
            >
              Inbox
              {notifications.filter(n => !n.IsRead).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-xs bg-red-500 text-white font-bold">
                  {notifications.filter(n => !n.IsRead).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`text-sm font-semibold pb-1 border-b-2 transition-all duration-200 ${activeTab === 'activities'
                ? 'border-primary text-primary dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                }`}
            >
              Activities
            </button>
          </div>
          {activeTab === 'inbox' && notifications.some(n => !n.IsRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 bg-transparent transition-colors duration-200"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Content List */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {currentLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className={`px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center justify-center`}>
            <FaExclamationTriangle className="mr-2" />
            {error}
          </div>
        ) : activeTab === 'inbox' && notifications.length === 0 ? (
          <div className={`px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400`}>
            <FaEnvelopeOpen className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="font-medium">Inbox is clean!</p>
            <p className="text-xs text-gray-400 mt-1">We will alert you when you get mentioned or assigned tasks.</p>
          </div>
        ) : activeTab === 'activities' && activities.length === 0 ? (
          <div className={`px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400`}>
            <FaHistory className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="font-medium">No recent activities</p>
          </div>
        ) : activeTab === 'inbox' ? (
          <div className="divide-y divide-gray-100 dark:divide-dark-border/40">
            {notifications.map((noti) => (
              <div
                key={noti.NotificationID}
                onClick={() => handleNotificationClick(noti)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover/20 transition-all duration-150 relative ${!noti.IsRead ? 'bg-primary/5 dark:bg-blue-500/10' : ''
                  }`}
              >
                {!noti.IsRead && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow" />
                )}
                <div className="flex items-start space-x-3 pl-2">
                  <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-slate-50 dark:bg-dark-card`}>
                    {getNotiIcon(noti.Type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight text-gray-900 dark:text-[#F3F6FA]`}>
                      {noti.Title}
                    </p>
                    <p className={`text-xs mt-1 leading-normal text-gray-600 dark:text-zinc-300 break-words`}>
                      {noti.Body}
                    </p>
                    <p className={`text-xs mt-1.5 font-medium text-gray-400 dark:text-zinc-500`}>
                      {formatDate(noti.CreatedDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-border/40">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover/20 transition-colors duration-150`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-slate-50 dark:bg-dark-card`}>
                    {getActivityIcon(activity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold text-gray-900 dark:text-[#F3F6FA]`}>
                        {getActivityTitle(activity)}
                      </p>
                      <span className={`text-xs font-medium ${getActivityStatus(activity)}`}>
                        {activity.status === 'success' && 'Success'}
                        {activity.status === 'error' && 'Error'}
                        {activity.status === 'warning' && 'Warning'}
                      </span>
                    </div>
                    {activity.details && (
                      <p className={`text-xs mt-1 leading-normal text-gray-600 dark:text-zinc-300`}>
                        {activity.details}
                      </p>
                    )}
                    <p className={`text-xs mt-1.5 font-medium text-gray-400 dark:text-zinc-500`}>
                      {formatDate(activity.timestamp)}
                    </p>
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