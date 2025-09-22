import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { teamService, projectService, authService, taskService, commonTypeService } from '../services/api';
import { getProjectStatusStyle, getProjectStatusBadge } from '../components/project/ProjectStatusBadge';
import { getTaskTypeStyle, getTaskTypeBadge } from '../components/task/TaskTypeBadge';
import { getDeadlineStatus, calculateDeadlineText } from '../components/shared/DeadlineStatusBadge';
import { useRouter } from 'next/router';
import { subscribe } from '../services/socket';

const GlobalContext = createContext();

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};

export const GlobalProvider = ({ children }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasksDetails, setTasksDetails] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onboardingData, setOnboardingData] = useState({
    onboardingCompleted: false,
    onboardingStep: 'welcome',
    onboardingProgress: {
      profileComplete: false,
      organizationComplete: false,
      teamCreated: false,
      projectCreated: false,
      onboardingComplete: false
    }
  });

  // Fetch organizations
  const fetchOrganizations = async () => {
    try {
      const orgs = await authService.getUserOrganizations();
      setOrganization(orgs);
      return orgs;
    } catch (err) {
      setError('Failed to fetch organizations');
      console.error('Error fetching organizations:', err);
      return null;
    }
  };

  // Get project status by code
  const getProjectStatus = (statusCode) => {
    return projectStatuses.find(status => status.Code === statusCode) || { Value: 'Not Assigned', Code: 1 };
  };

  // Get project status badge component
  const getProjectStatusBadgeComponent = (statusCode, showTooltip = true) => {
    const status = getProjectStatus(statusCode);
    return getProjectStatusBadge(status, showTooltip);
  };

  // Get task type style
  const getTaskTypeStyleComponent = (type) => {
    return getTaskTypeStyle(type);
  };

  // Get task type badge component
  const getTaskTypeBadgeComponent = (type) => {
    return getTaskTypeBadge(type);
  };

  // Get task status text
  const getTaskStatusText = (statusCode) => {
    const statusTexts = {
      1: 'Not Assigned',
      2: 'Assigned',
      3: 'In Progress',
      4: 'QA',
      5: 'Deployment',
      6: 'Completed'
    };
    return statusTexts[statusCode] || 'Unknown';
  };

  // Get deadline status component
  const getDeadlineStatusComponent = (deadlineText) => {
    return getDeadlineStatus(deadlineText);
  };

  // Calculate deadline text component
  const calculateDeadlineTextComponent = (dueDate) => {
    return calculateDeadlineText(dueDate);
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const overview = await authService.getUserOverview();
        if (overview) {          
          setUserDetails(overview.user);
          setTeams(overview.teams);
          setProjects(overview.projects);
          setOrganization(overview.organization);
          setTasksDetails(overview.tasks);
          setProjectStatuses(overview.projectStatuses);
          setOnboardingData({
            onboardingCompleted: overview.onboardingCompleted || false,
            onboardingStep: overview.onboardingStep || 'welcome',
            onboardingProgress: overview.onboardingProgress || {
              profileComplete: false,
              organizationComplete: false,
              teamCreated: false,
              projectCreated: false,
              onboardingComplete: false
            }
          });
        }
      } catch (err) {
        setError('Failed to fetch user overview');
        console.error('Error initializing data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if not on landing page
    if (user && router.pathname !== '/') {
      initializeData();
    }
  }, [user, router.pathname]);

  // Subscribe to real-time team events
  useEffect(() => {
    if (!user) return;

    const unsubscribeTeamCreated = subscribe('team.created', (payload) => {
      const { data } = payload || {};
      if (!data || !data.team) return;
      setTeams(prev => [...prev, data.team]);
    });

    const unsubscribeTeamUpdated = subscribe('team.updated', (payload) => {
      const { data } = payload || {};
      if (!data || !data.team) return;
      setTeams(prev => prev.map(t => 
        t.TeamID === data.teamId ? data.team : t
      ));
    });

    const unsubscribeTeamDeleted = subscribe('team.deleted', (payload) => {
      const { data } = payload || {};
      if (!data || !data.team) return;
      setTeams(prev => prev.filter(t => t.TeamID !== data.teamId));
    });

    const unsubscribeTeamStatusUpdated = subscribe('team.status.updated', (payload) => {
      const { data } = payload || {};
      if (!data || !data.team) return;
      setTeams(prev => prev.map(t => 
        t.TeamID === data.teamId ? data.team : t
      ));
    });

    return () => {
      unsubscribeTeamCreated();
      unsubscribeTeamUpdated();
      unsubscribeTeamDeleted();
      unsubscribeTeamStatusUpdated();
    };
  }, [user]);

  const refreshOrganizations = async () => {
    return await fetchOrganizations();
  };

  // Table styling functions for consistent table appearance across the system
  const getTableHeaderClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? (darkClass || 'border-b border-gray-700') : (lightClass || 'border-b border-gray-200');
  };

  const getTableHeaderTextClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? (darkClass || 'text-gray-100') : (lightClass || 'text-gray-900');
  };

  const getTableRowClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? (darkClass || 'border-b border-gray-700 dark:hover:bg-gray-700/30 transition-colors last:border-b-0') : (lightClass || 'border-b border-gray-100 hover:bg-gray-50/50 transition-colors last:border-b-0');
  };

  const getTableTextClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? (darkClass || 'text-gray-100') : (lightClass || 'text-gray-900');
  };

  const getTableSecondaryTextClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? (darkClass || 'text-gray-400') : (lightClass || 'text-gray-500');
  };

  // Theme-aware classes function for consistent styling across the system
  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? darkClasses : lightClasses;
  };

  // Helper function to check if a user ID matches the current user
  const isMe = (userId) => {
    if (!userId || !userDetails?._id) return false;
    try {
      return String(userId) === String(userDetails._id);
    } catch (_) {
      return false;
    }
  };

  // Helper function to format date with UTC to avoid timezone issues
  const formatDateUTC = (dateLike) => {
    if (!dateLike) return '-';
    const d = new Date(dateLike);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  // Helper function to format date for general use
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format date with time
  const formatDateWithTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get status color based on status code
  const getStatusColor = (statusCode) => {
    const isDark = theme === 'dark';
    const statusMap = {
      1: isDark ? 'bg-gray-600' : 'bg-gray-300',      // Not Assigned
      2: isDark ? 'bg-indigo-600' : 'bg-indigo-400',  // Assigned
      3: isDark ? 'bg-yellow-600' : 'bg-yellow-400',  // In Progress
      4: isDark ? 'bg-green-600' : 'bg-green-400',    // Completed
      5: isDark ? 'bg-red-600' : 'bg-red-400',        // Cancelled
    };
    return statusMap[statusCode] || statusMap[1];
  };

  // Helper function to get priority style
  const getPriorityStyle = (priority) => {
    const isDark = theme === 'dark';
    const styles = {
      'High': {
        bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50',
        textColor: isDark ? 'text-red-400' : 'text-red-700',
        borderColor: isDark ? 'border-red-700' : 'border-red-200',
      },
      'Medium': {
        bgColor: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
        textColor: isDark ? 'text-yellow-400' : 'text-yellow-700',
        borderColor: isDark ? 'border-yellow-700' : 'border-yellow-200',
      },
      'Low': {
        bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
        textColor: isDark ? 'text-green-400' : 'text-green-700',
        borderColor: isDark ? 'border-green-700' : 'border-green-200',
      },
    };
    return styles[priority] || styles['Medium'];
  };

  // Helper function to format display name with user indication
  const displayName = (details, id) => {
    return (details?.fullName || '-') + (isMe(id) ? ' (You)' : '');
  };

  // Helper function to get user initials from full name (robust to non-strings)
  const getUserInitials = (fullName) => {
    if (!fullName) return '??';
    try {
      // If an object with name parts is passed, prefer those
      if (typeof fullName === 'object') {
        const fn = fullName.firstName || fullName.first_name || fullName.given_name || '';
        const ln = fullName.lastName || fullName.last_name || fullName.family_name || '';
        const initialsFromParts = (fn.charAt(0) + ln.charAt(0)).toUpperCase();
        if (initialsFromParts.trim()) return initialsFromParts;
        fullName = String(fullName);
      }
      if (typeof fullName !== 'string') fullName = String(fullName);
      const names = String(fullName).trim().split(/\s+/).filter(Boolean);
      const firstName = names[0] || '';
      const lastName = names.length > 1 ? names[names.length - 1] : '';
      const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      return initials || (firstName.charAt(0).toUpperCase() || '??');
    } catch {
      return '??';
    }
  };

  // Helper function to get user initials from first and last name
  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  // Helper function to get avatar color based on name
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400',
      'bg-indigo-400', 'bg-yellow-400', 'bg-red-400', 'bg-teal-400'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Helper function to get meeting days badge color
  const getDaysBadgeColor = (status) => {
    switch (status) {
      case 'today':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-400 dark:border-blue-700';
      case 'tomorrow':
        return 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-400 dark:border-green-700';
      case 'upcoming':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:text-yellow-400 dark:border-yellow-700';
      case 'yesterday':
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 dark:text-gray-400 dark:border-gray-700';
      case 'past':
        return 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:text-red-400 dark:border-red-700';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 dark:text-gray-400 dark:border-gray-700';
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to get file icon type based on extension
  const getFileIconType = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'webp':
        return 'image';
      case 'pdf':
        return 'pdf';
      case 'doc':
      case 'docx':
        return 'word';
      case 'xls':
      case 'xlsx':
        return 'excel';
      case 'ppt':
      case 'pptx':
        return 'powerpoint';
      case 'txt':
        return 'text';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'video';
      case 'mp3':
      case 'wav':
      case 'flac':
        return 'audio';
      case 'js':
      case 'ts':
      case 'html':
      case 'css':
      case 'json':
        return 'code';
      default:
        return 'file';
    }
  };

  // Helper function to validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Helper function to validate password strength
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: {
        minLength: password.length < minLength,
        hasUpperCase: !hasUpperCase,
        hasLowerCase: !hasLowerCase,
        hasNumbers: !hasNumbers,
        hasSpecialChar: !hasSpecialChar
      }
    };
  };

  // Helper function to get join request status style
  const getJoinRequestStatusStyle = (status) => {
    const isDark = theme === 'dark';
    const styles = {
      'pending': {
        bgColor: isDark ? 'from-yellow-900/50 to-yellow-800/50' : 'from-yellow-50 to-yellow-100',
        textColor: isDark ? 'text-yellow-200' : 'text-yellow-700',
        borderColor: isDark ? 'border-yellow-700' : 'border-yellow-200',
        icon: 'FaClock'
      },
      'approved': {
        bgColor: isDark ? 'from-green-900/50 to-green-800/50' : 'from-green-50 to-green-100',
        textColor: isDark ? 'text-green-200' : 'text-green-700',
        borderColor: isDark ? 'border-green-700' : 'border-green-200',
        icon: 'FaCheck'
      },
      'rejected': {
        bgColor: isDark ? 'from-red-900/50 to-red-800/50' : 'from-red-50 to-red-100',
        textColor: isDark ? 'text-red-200' : 'text-red-700',
        borderColor: isDark ? 'border-red-700' : 'border-red-200',
        icon: 'FaTimes'
      }
    };
    return styles[status] || styles['pending'];
  };

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const targetDate = new Date(date);
    const diffInMinutes = Math.floor((now - targetDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper function to capitalize first letter
  const capitalize = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  // Helper function to generate random ID
  const generateId = (prefix = 'id') => {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  };

  // Helper function to check if value is empty
  const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  };

  // Helper function to check if value is not empty
  const isNotEmpty = (value) => {
    return !isEmpty(value);
  };

  // Helper function to debounce function calls
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const value = {
    userDetails,
    teams,
    projects,
    tasksDetails,
    organization,
    projectStatuses,
    loading,
    error,
    onboardingData,
    refreshOrganizations,
    setProjects,
    setTeams,
    setTasksDetails,
    setOrganization,
    getProjectStatus,
    getProjectStatusStyle,
    getProjectStatusBadgeComponent,
    getTaskTypeStyleComponent,
    getTaskTypeBadgeComponent,
    getTaskStatusText,
    getDeadlineStatusComponent,
    calculateDeadlineTextComponent,
    setUserDetails,
    getTableHeaderClasses,
    getTableHeaderTextClasses,
    getTableRowClasses,
    getTableTextClasses,
    getTableSecondaryTextClasses,
    getThemeClasses,
    isMe,
    formatDateUTC,
    formatDate,
    formatDateWithTime,
    getStatusColor,
    getPriorityStyle,
    displayName,
    getUserInitials,
    getInitials,
    getAvatarColor,
    getDaysBadgeColor,
    formatFileSize,
    getFileIconType,
    validateEmail,
    validatePassword,
    getJoinRequestStatusStyle,
    formatTimeAgo,
    truncateText,
    capitalize,
    generateId,
    isEmpty,
    isNotEmpty,
    debounce,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext; 