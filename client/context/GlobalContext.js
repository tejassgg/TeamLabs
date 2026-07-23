import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { teamService, projectService, authService, taskService, commonTypeService, searchService } from '../services/api';
import { getProjectStatusStyle, getProjectStatusBadge } from '../components/project/ProjectStatusBadge';
import { getTaskTypeStyle, getTaskTypeBadge, getTaskStatusBadge, getTaskStatusLabel } from '../components/task/TaskTypeBadge';
import { getDeadlineStatus, calculateDeadlineText } from '../components/shared/DeadlineStatusBadge';
import StatusPill from '../components/shared/StatusPill';
import { useRouter } from 'next/router';
import { subscribe, connectSocket } from '../services/socket';

const GlobalContext = createContext();

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};

export const GlobalProvider = ({ children }) => {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);
  const [isLoggedInState, setIsLoggedInState] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedInState(localStorage.getItem('isLoggedIn') === 'true');
    }
  }, []);

  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasksDetails, setTasksDetails] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tempAuthData, setTempAuthData] = useState(null);
  const dataFetchedRef = useRef(false);
  const [orgMembers, setOrgMembers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [subtasks, setSubtasks] = useState([]);

  // Compute searchData dynamically from current context states
  const searchData = useMemo(() => {
    return {
      projects,
      teams,
      users: orgMembers,
      tasks: tasksDetails,
      attachments,
      comments,
      meetings,
      subtasks
    };
  }, [projects, teams, orgMembers, tasksDetails, attachments, comments, meetings, subtasks]);
  const [searchLoading, setSearchLoading] = useState(false);
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

  const getTaskTypeScheme = (type) => {
    const schemes = {
      'Bug': {
        bg: 'bg-red-50/40 dark:bg-red-950/10',
        border: 'border-red-100 dark:border-red-950/30',
        accent: 'text-red-600 bg-red-100/40 dark:text-red-400 dark:bg-red-950/40',
        textColor: 'text-red-800 dark:text-red-300'
      },
      'Feature': {
        bg: 'bg-blue-50/40 dark:bg-blue-950/10',
        border: 'border-blue-100 dark:border-blue-950/30',
        accent: 'text-blue-600 bg-blue-100/40 dark:text-blue-400 dark:bg-blue-950/40',
        textColor: 'text-primary dark:text-blue-300'
      },
      'Improvement': {
        bg: 'bg-green-50/40 dark:bg-green-950/10',
        border: 'border-green-100 dark:border-green-950/30',
        accent: 'text-green-600 bg-green-100/40 dark:text-green-400 dark:bg-green-950/40',
        textColor: 'text-green-800 dark:text-green-300'
      },
      'Documentation': {
        bg: 'bg-indigo-50/40 dark:bg-indigo-950/10',
        border: 'border-indigo-100 dark:border-indigo-950/30',
        accent: 'text-indigo-600 bg-indigo-100/40 dark:text-indigo-400 dark:bg-indigo-950/40',
        textColor: 'text-indigo-800 dark:text-indigo-300'
      },
      'Maintenance': {
        bg: 'bg-amber-50/40 dark:bg-amber-950/10',
        border: 'border-amber-100 dark:border-amber-950/30',
        accent: 'text-amber-600 bg-amber-100/40 dark:text-amber-400 dark:bg-amber-950/40',
        textColor: 'text-amber-800 dark:text-amber-300'
      },
      'User Story': {
        bg: 'bg-purple-50/40 dark:bg-purple-950/10',
        border: 'border-purple-100 dark:border-purple-950/30',
        accent: 'text-purple-600 bg-purple-100/40 dark:text-purple-400 dark:bg-purple-950/40',
        textColor: 'text-purple-800 dark:text-purple-300'
      },
      'Support': {
        bg: 'bg-orange-50/40 dark:bg-orange-950/10',
        border: 'border-orange-100 dark:border-orange-950/30',
        accent: 'text-orange-600 bg-orange-100/40 dark:text-orange-400 dark:bg-orange-950/40',
        textColor: 'text-orange-800 dark:text-orange-300'
      }
    };

    return schemes[type] || {
      bg: 'bg-gray-50/40 dark:bg-zinc-900/40',
      border: 'border-gray-200/80 dark:border-zinc-800/80',
      accent: 'text-zinc-600 bg-gray-150/40 dark:text-zinc-400 dark:bg-zinc-800/40',
      textColor: 'text-zinc-800 dark:text-zinc-300'
    };
  };

  // Get task status badge component (reusable globally)
  const getStatus = (statusCode) => {
    return getTaskStatusBadge(statusCode);
  };

  // Get member status badge component (reusable globally)
  const getMemberStatusBadgeComponent = (status) => {
    return <StatusPill status={status} />;
  };

  // Get task status text
  const getTaskStatusText = (statusCode) => {
    return getTaskStatusLabel(statusCode);
  };

  // Get deadline status component
  const getDeadlineStatusComponent = (deadlineText) => {
    return getDeadlineStatus(deadlineText);
  };

  // Calculate deadline text component
  const calculateDeadlineTextComponent = (dueDate) => {
    return calculateDeadlineText(dueDate);
  };

  // Verify 2FA during login
  const verifyLogin2FA = async (code) => {
    try {
      if (!tempAuthData) {
        throw new Error('No pending 2FA verification');
      }
      const data = await authService.verifyLogin2FA(code, tempAuthData.userId);
      setUserDetails(data);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setTempAuthData(null);
      localStorage.setItem('isLoggedIn', 'true');
      setIsLoggedInState(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to verify 2FA code'
      };
    }
  };

  // Register new user
  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      return { success: true, message: data?.message };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to register'
      };
    }
  };

  // Resend email verification
  const resendVerification = async (usernameOrEmail) => {
    try {
      const data = await authService.resendVerification(usernameOrEmail);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to resend verification email' };
    }
  };

  // Google login
  const googleLogin = async (credential, inviteToken = null) => {
    try {
      const data = await authService.googleLogin(credential, inviteToken);
      setUserDetails(data);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('isLoggedIn', 'true');
      setIsLoggedInState(true);
      return {
        success: true,
        needsAdditionalDetails: data.needsAdditionalDetails || false
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to login with Google'
      };
    }
  };

  // Request sign in code
  const requestSignInCode = async (email) => {
    try {
      const data = await authService.requestSignInCode(email);
      return { success: true, message: data?.message };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to send verification code'
      };
    }
  };

  // Verify sign in code
  const verifySignInCode = async (email, code) => {
    try {
      const data = await authService.verifySignInCode(email, code);
      if (data.twoFactorEnabled) {
        // Store temporary auth data for 2FA verification
        setTempAuthData({
          userId: data.userId
        });
        return {
          success: true,
          twoFactorEnabled: true
        };
      }
      setUserDetails(data);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('isLoggedIn', 'true');
      setIsLoggedInState(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to verify verification code'
      };
    }
  };

  // Complete user profile
  const completeProfile = async (profileData) => {
    try {
      const data = await authService.completeProfile(profileData);
      setUserDetails(data);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to complete profile'
      };
    }
  };

  // Logout
  const logout = () => {
    // Perform server-side logout
    authService.logout();

    // Reset all context state to defaults / nulls
    setUserDetails(null);
    setTeams([]);
    setProjects([]);
    setTasksDetails([]);
    setOrganization(null);
    setProjectStatuses([]);
    setOrgMembers([]);
    setAttachments([]);
    setComments([]);
    setMeetings([]);
    setSubtasks([]);
    setTempAuthData(null);
    setError(null);

    // Reset any fetch guard refs
    if (dataFetchedRef && typeof dataFetchedRef === 'object') dataFetchedRef.current = false;

    // Clear auth and sensitive data, but keep preferences (theme, dashboard layouts, etc.)
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('projects');
    localStorage.removeItem('tasksDetails');
    localStorage.removeItem('github_userId');
    localStorage.removeItem('github_state');

    setIsLoggedInState(false);
    router.push('/');
  };

  // Fetch search prefetch data globally (no-op since we compute it locally)
  const fetchSearchDataGlobal = async (force = false) => {
    return searchData;
  };

  // Update user data
  const updateUser = (updatedUserData) => {
    setUserDetails(updatedUserData);
  };

  // Combined Authentication & Initial Data Fetch
  useEffect(() => {
    const initAuthAndData = async () => {
      const storedLoggedIn = localStorage.getItem('isLoggedIn');
      if (!storedLoggedIn) {
        setLoading(false);
        return;
      }

      // If on the landing page, do not query the server-side APIs to optimize network calls
      if (router.pathname === '/') {
        setLoading(false);
        return;
      }

      // If data is already fetched and userDetails exists, skip refetching
      if (dataFetchedRef.current && userDetails) {
        setLoading(false);
        return;
      }

      dataFetchedRef.current = true;
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
          setOrgMembers(overview.users || []);
          setAttachments(overview.attachments || []);
          setComments(overview.comments || []);
          setMeetings(overview.meetings || []);
          setSubtasks(overview.subtasks || []);
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
          setIsLoggedInState(true);

          // Trigger search data prefetch globally on dashboard load (no-op now)
          fetchSearchDataGlobal();
        }
      } catch (err) {
        console.error('Authentication/Initialization error:', err);
        dataFetchedRef.current = false;
        // Clear session on authentication failure
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('token');
        setIsLoggedInState(false);
        setUserDetails(null);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    initAuthAndData();
  }, [router.pathname]);

  // Connect socket when user details are retrieved/changed
  useEffect(() => {
    if (userDetails) {
      connectSocket();
      // Register for Web Push notifications
      import('../utils/webPushRegister').then(({ registerPushNotifications }) => {
        registerPushNotifications();
      }).catch(err => console.error('Failed to import push notifications registration:', err));
    }
  }, [userDetails]);

  // Subscribe to real-time team events
  useEffect(() => {
    if (!userDetails) return;

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
  }, [userDetails]);

  const refreshOrganizations = async () => {
    return await fetchOrganizations();
  };

  // Table styling functions for consistent table appearance across the system
  const combineThemeClasses = (lightClass, defaultLight, darkClass, defaultDark) => {
    const light = lightClass || defaultLight;
    const dark = darkClass || defaultDark;
    const darkPrefixed = dark.split(' ').filter(Boolean).map(c => c.startsWith('dark:') ? c : `dark:${c}`).join(' ');
    return `${light} ${darkPrefixed}`.trim();
  };

  const getTableHeaderClasses = (lightClass, darkClass) => {
    return combineThemeClasses(lightClass, 'border-b border-gray-200', darkClass, 'border-b border-gray-700');
  };

  const getTableHeaderTextClasses = (lightClass, darkClass) => {
    return combineThemeClasses(lightClass, 'text-gray-900', darkClass, 'text-gray-100');
  };

  const getTableRowClasses = (lightClass, darkClass) => {
    return combineThemeClasses(
      lightClass,
      'border-b border-gray-100 hover:bg-gray-50/50 transition-colors last:border-b-0',
      darkClass,
      'border-b border-gray-700 hover:bg-gray-50/50 hover:bg-[#232329]/40 transition-colors last:border-b-0'
    );
  };

  const getTableTextClasses = (lightClass, darkClass) => {
    return combineThemeClasses(lightClass, 'text-gray-900 whitespace-nowrap', darkClass, 'text-gray-100 whitespace-nowrap');
  };

  const getTableSecondaryTextClasses = (lightClass, darkClass) => {
    return combineThemeClasses(lightClass, 'text-gray-500', darkClass, 'text-gray-400');
  };

  // Theme-aware classes function for consistent styling across the system

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
      day: 'numeric'
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
    const statusMap = {
      1: 'dark:bg-gray-600 bg-gray-300',      // Not Assigned
      2: 'dark:bg-indigo-600 bg-indigo-400',  // Assigned
      3: 'dark:bg-yellow-600 bg-yellow-400',  // In Progress
      4: 'dark:bg-green-600 bg-green-400',    // Completed
      5: 'dark:bg-red-600 bg-red-400',        // Cancelled
    };
    return statusMap[statusCode] || statusMap[1];
  };

  // Helper function to get priority style
  const getPriorityStyle = (priority) => {
    const styles = {
      'Critical': {
        bgColor: 'dark:bg-rose-900/30 bg-rose-50',
        textColor: 'dark:text-rose-400 text-rose-700',
        borderColor: 'dark:border-rose-700 border-rose-200'
      },
      'High': {
        bgColor: 'dark:bg-red-900/20 bg-red-50',
        textColor: 'dark:text-red-400 text-red-700',
        borderColor: 'dark:border-red-700 border-red-200'
      },
      'Medium': {
        bgColor: 'dark:bg-yellow-900/20 bg-yellow-50',
        textColor: 'dark:text-yellow-400 text-yellow-700',
        borderColor: 'dark:border-yellow-700 border-yellow-200'
      },
      'Low': {
        bgColor: 'dark:bg-green-900/20 bg-green-50',
        textColor: 'dark:text-green-400 text-green-700',
        borderColor: 'dark:border-green-700 border-green-200'
      }
    };
    const norm = priority === 0 || priority === '0' ? 'Critical' : priority;
    return styles[norm] || styles['Medium'];
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

  // Helper function to get join request status style
  const getJoinRequestStatusStyle = (status) => {
    const styles = {
      'pending': {
        bgColor: 'dark:from-yellow-900/50 dark:to-yellow-800/50 from-yellow-50 to-yellow-100',
        textColor: 'dark:text-yellow-200 text-yellow-700',
        borderColor: 'dark:border-yellow-700 border-yellow-200',
        icon: 'FaClock'
      },
      'approved': {
        bgColor: 'dark:from-green-900/50 dark:to-green-800/50 from-green-50 to-green-100',
        textColor: 'dark:text-green-200 text-green-700',
        borderColor: 'dark:border-green-700 border-green-200',
        icon: 'FaCheck'
      },
      'rejected': {
        bgColor: 'dark:from-red-900/50 dark:to-red-800/50 from-red-50 to-red-100',
        textColor: 'dark:text-red-200 text-red-700',
        borderColor: 'dark:border-red-700 border-red-200',
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

  // Add Task Modal Global State
  const [addTaskModalConfig, setAddTaskModalConfig] = useState({
    isOpen: false,
    mode: 'fromSideBar',
    projectIdDefault: '',
    parentIdDefault: '',
    userStories: [],
    editingTask: null,
    addTaskTypeMode: 'task',
    projectMembers: [],
    onAddTask: null,
    onUpdateTask: null,
    onSuccess: null
  });

  const openAddTaskModal = (config = {}) => {
    setAddTaskModalConfig({
      isOpen: true,
      mode: config.mode || 'fromSideBar',
      projectIdDefault: config.projectIdDefault || '',
      parentIdDefault: config.parentIdDefault || '',
      userStories: config.userStories || [],
      editingTask: config.editingTask || null,
      addTaskTypeMode: config.addTaskTypeMode || 'task',
      projectMembers: config.projectMembers || [],
      onAddTask: config.onAddTask || null,
      onUpdateTask: config.onUpdateTask || null,
      onSuccess: config.onSuccess || null
    });
  };

  const closeAddTaskModal = () => {
    setAddTaskModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const value = {
    addTaskModalConfig,
    openAddTaskModal,
    closeAddTaskModal,
    userDetails,
    teams,
    projects,
    tasksDetails,
    organization,
    projectStatuses,
    searchData,
    searchLoading,
    loading,
    error,
    onboardingData,
    refreshOrganizations,
    setProjects,
    setTeams,
    setTasksDetails,
    isAuthenticated: isLoggedInState || !!userDetails,
    loading,
    verifyLogin2FA,
    register,
    googleLogin,
    completeProfile,
    logout,
    updateUser,
    resendVerification,
    requestSignInCode,
    verifySignInCode,
    tempAuthData,
    setOrganization,
    getProjectStatus,
    getProjectStatusStyle,
    getProjectStatusBadgeComponent,
    getMemberStatusBadgeComponent,
    getTaskTypeStyleComponent,
    getTaskTypeBadgeComponent,
    getTaskTypeScheme,
    getTaskStatusText,
    getStatus,
    getDeadlineStatusComponent,
    calculateDeadlineTextComponent,
    setUserDetails,
    getTableHeaderClasses,
    getTableHeaderTextClasses,
    getTableRowClasses,
    getTableTextClasses,
    getTableSecondaryTextClasses,
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
    getJoinRequestStatusStyle,
    formatTimeAgo,
    truncateText,
    capitalize,
    generateId,
    isEmpty,
    isNotEmpty,
    debounce,
    fetchSearchDataGlobal
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext; 