import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useTheme } from '../context/ThemeContext';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';
import ProjectStatusDropdown from '../components/dashboard/ProjectStatusDropdown';
import { FaTrash, FaProjectDiagram, FaChartBar, FaRedo, FaPlus, FaGripHorizontal, FaExpandAlt, FaCompressAlt, FaCog, FaTimes, FaUndo, FaWrench, FaCheck, FaClock, FaUserFriends, FaBell, FaComments, FaChevronDown, FaChevronUp, FaGithub, FaGitlab, FaTasks, FaPaperclip, FaCalendarAlt, FaSlidersH, FaExternalLinkAlt } from 'react-icons/fa';
import api, { projectService, userService, commonTypeService, taskService } from '../services/api';
import { connectSocket, subscribe } from '../services/socket';
import OnboardingGuide from '../components/dashboard/OnboardingGuide';
import AdminWelcomeMessage from '../components/dashboard/AdminWelcomeMessage';
import FirstTimeSetup from '../components/shared/FirstTimeSetup';
import InviteModal from '../components/shared/InviteModal';
import { FcAcceptDatabase, FcExpired } from "react-icons/fc";
import useSWR from 'swr';
import { getPriorityBadge, getTaskTypeBadge } from '../components/task/TaskTypeBadge';
import { calculateMeetingDays } from '../utils/dateUtils';

// Modular Dashboard Widgets
import BurndownWidget from '../components/dashboard/BurndownWidget';
import TimeTrackerWidget from '../components/dashboard/TimeTrackerWidget';

// Custom High-Fidelity SVGs for Meet and Zoom
const GoogleMeetLogo = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 11.75V8c0-1.1-.9-2-2-2H2c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3.75l5 4.5V7.25l-5 4.5Z" fill="#00832F" />
    <path d="M16 8v8c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h13c.55 0 1 .45 1 1Z" fill="#4285F4" />
    <path d="M0 8a2 2 0 0 1 2-2h3v10H2a2 2 0 0 1-2-2V8Z" fill="#EA4335" />
    <path d="M13 14H2V8h11v6Z" fill="#FBBC05" />
  </svg>
);

const ZoomLogo = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#2D8CFF" />
    <path d="M6 9h8a1 1 0 011 1v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 011-1zm10.5 1.5l2.5-2v7l-2.5-2v-3z" fill="white" />
  </svg>
);

const DiagonalArrow = () => (
  <svg className="w-3.5 h-3.5 text-gray-705 text-gray-800 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);

// Dynamic import for charts
let DashboardCharts = null;

DashboardCharts = require('../components/dashboard/DashboardCharts').default

const Dashboard = () => {
  const { theme } = useTheme();
  const { projectStatuses, getProjectStatus, teams, projects, userDetails, formatDateWithTime, loading, tasksDetails, setTasksDetails, organization, getMemberStatusBadgeComponent, openAddTaskModal, getDeadlineStatusComponent, getTaskTypeScheme } = useGlobal();
  const { showToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [removingUser, setRemovingUser] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const isAdmin = userDetails?.role === 'Admin';
  const [activeTab, setActiveTab] = useState('whats_up');   // whats_up, metrics, manage
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const [showAllTodos, setShowAllTodos] = useState(false);
  const [todoFilter, setTodoFilter] = useState('all');
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [animatingTaskIds, setAnimatingTaskIds] = useState([]);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState(3);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [taskStatuses, setTaskStatuses] = useState([]);

  useEffect(() => {
    commonTypeService.getTaskStatuses()
      .then(res => {
        setTaskStatuses(res || []);
      })
      .catch(err => {
        console.error('Failed to load task statuses:', err);
      });
  }, []);

  const statusOptions = useMemo(() => [
    ...taskStatuses.map(status => ({
      code: status.Code,
      value: status.Value
    }))
  ], [taskStatuses]);



  // SWR-based whats-up query
  const { data: whatsUpData, error: whatsUpError, mutate: mutateWhatsUp } = useSWR(
    userDetails?.organizationID ? `/dashboard/${userDetails.organizationID}/whats-up` : null,
    null,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000 }
  );

  const whatsUpLoading = !whatsUpData && !whatsUpError && !!userDetails?.organizationID;

  const filteredMyTasks = useMemo(() => {
    const tasks = whatsUpData?.todos || [];
    if (selectedTaskStatus === 'all') return tasks;
    const targetStatus = taskStatuses.find(s => s.Code === Number(selectedTaskStatus));
    const targetVal = targetStatus ? targetStatus.Value.toLowerCase() : '';
    return tasks.filter(t => {
      const tStatus = String(t.Status).toLowerCase();
      return tStatus === String(selectedTaskStatus) || tStatus === targetVal;
    });
  }, [whatsUpData?.todos, selectedTaskStatus, taskStatuses]);

  const handleMarkDone = async (taskId) => {
    try {
      await api.patch(`/task-details/${taskId}/status`, { Status: 5 });
      showToast('Task marked as completed!', 'success');
      setSessionCompletedCount(prev => prev + 1);
      mutateWhatsUp();
    } catch (err) {
      console.error('Failed to complete task:', err);
      showToast('Failed to mark task as completed', 'error');
    }
  };

  const handleCheckboxClick = async (taskId) => {
    if (animatingTaskIds.includes(taskId)) return;
    setAnimatingTaskIds(prev => [...prev, taskId]);
    setTimeout(async () => {
      try {
        await handleMarkDone(taskId);
      } finally {
        setAnimatingTaskIds(prev => prev.filter(id => id !== taskId));
      }
    }, 400);
  };

  const formatDistanceToNow = (date) => {
    const diffMs = new Date() - new Date(date);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHr > 0) return `${diffHr}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  const formatMeetingDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatMeetingTimeRange = (startStr, endStr) => {
    if (!startStr) return 'TBD';
    const start = formatTime(startStr);
    if (!endStr) return start;
    const end = formatTime(endStr);
    return `${start} - ${end}`;
  };

  // SWR-based dashboard stats query
  const { data: dashboardData, error: dashboardFetchError } = useSWR(
    userDetails?.organizationID ? `/dashboard/${userDetails.organizationID}` : null,
    null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000 }
  );

  const statsLoading = !dashboardData && !dashboardFetchError && !stats && !!userDetails?.organizationID;

  // Sync dashboardData with stats local state
  useEffect(() => {
    if (dashboardData) {
      setStats(dashboardData);
    }
  }, [dashboardData]);

  // Sync stats fetching error state
  useEffect(() => {
    if (dashboardFetchError) {
      setError('Failed to fetch dashboard statistics');
      console.error(dashboardFetchError);
    }
  }, [dashboardFetchError]);

  // Widget customization states
  const DEFAULT_WIDGETS = useMemo(() => [
    { id: 'analytics', title: 'Metrics & Analytics', visible: true, colSpan: 2 },
  ], []);

  const [widgets, setWidgets] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Load layout from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dashboard_widgets_layout');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const validIds = DEFAULT_WIDGETS.map(w => w.id);
        const filtered = parsed.filter(w => validIds.includes(w.id));
        const filteredIds = filtered.map(w => w.id);
        const missing = DEFAULT_WIDGETS.filter(w => !filteredIds.includes(w.id));
        setWidgets([...filtered, ...missing]);
      } catch (e) {
        setWidgets(DEFAULT_WIDGETS);
      }
    } else {
      setWidgets(DEFAULT_WIDGETS);
    }
  }, [DEFAULT_WIDGETS]);

  // Layout handlers
  const toggleWidgetVisibility = (id) => {
    const nextWidgets = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setWidgets(nextWidgets);
    localStorage.setItem('dashboard_widgets_layout', JSON.stringify(nextWidgets));
    showToast(`Widget "${nextWidgets.find(w => w.id === id).title}" ${nextWidgets.find(w => w.id === id).visible ? 'enabled' : 'disabled'}`, 'info');
  };

  const toggleWidgetColSpan = (id) => {
    const nextWidgets = widgets.map(w => w.id === id ? { ...w, colSpan: w.colSpan === 2 ? 1 : 2 } : w);
    setWidgets(nextWidgets);
    localStorage.setItem('dashboard_widgets_layout', JSON.stringify(nextWidgets));
  };

  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.setItem('dashboard_widgets_layout', JSON.stringify(DEFAULT_WIDGETS));
    showToast('Dashboard layout reset to default.', 'success');
  };

  // HTML5 Drag and Drop handlers for grid widgets
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const nextWidgets = [...widgets];
    const draggedItem = nextWidgets[draggedIdx];
    nextWidgets.splice(draggedIdx, 1);
    nextWidgets.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setWidgets(nextWidgets);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    localStorage.setItem('dashboard_widgets_layout', JSON.stringify(widgets));
  };

  // Check if user has zero teams or zero projects
  const shouldShowWelcomeMessage = teams.length === 0 || projects.length === 0;

  useEffect(() => {
    if (userDetails?.organizationID) {
      // Phase 1: connect socket and subscribe to org member presence/updates
      connectSocket();
      const unsubPresence = subscribe('org.member.presence', (payload) => {
        const { data } = payload || {};
        if (!data || !data.userId) return;
        setStats((prev) => {
          if (!prev) return prev;
          const updatedMembers = (prev.members || []).map((m) => {
            if (m.id === data.userId) {
              const next = { ...m, lastLogin: data.lastActiveAt || m.lastLogin };
              // Only force Offline when user goes offline; do not override manual statuses on online
              if (data.online === false) {
                next.status = 'Offline';
              }
              return next;
            }
            return m;
          });
          return { ...prev, members: updatedMembers };
        });
      });
      const unsubUpdated = subscribe('org.member.updated', (payload) => {
        const { data } = payload || {};
        if (!data || !data.member) return;
        const member = data.member;
        setStats((prev) => {
          if (!prev) return prev;
          const exists = (prev.members || []).some((m) => m.id === member.userId);
          const updatedMembers = exists
            ? prev.members.map((m) => (m.id === member.userId ? {
              ...m,
              name: member.name || m.name,
              role: member.role || m.role,
              status: member.status || m.status
            } : m))
            : [member, ...(prev.members || [])];
          return { ...prev, members: updatedMembers };
        });
      });
      const unsubRemoved = subscribe('org.member.removed', (payload) => {
        const { data } = payload || {};
        if (!data || !data.userId) return;
        setStats((prev) => {
          if (!prev) return prev;
          const filtered = (prev.members || []).filter((m) => m.id !== data.userId);
          return { ...prev, members: filtered };
        });
      });

      const unsubMetrics = subscribe('dashboard.metrics.updated', (payload) => {
        const { data } = payload || {};
        if (!data || !data.metrics) return;
        setStats((prev) => prev ? { ...prev, ...data.metrics } : prev);
      });

      // Subscribe to team events to keep teams list in sync
      const unsubTeamCreated = subscribe('team.created', (payload) => {
        const { data } = payload || {};
        if (!data || !data.team) return;
        setStats((prev) => {
          if (!prev) return prev;
          const updatedTeams = [...(prev.teams || []), data.team];
          return { ...prev, teams: updatedTeams, totalTeams: updatedTeams.length };
        });
      });

      const unsubTeamUpdated = subscribe('team.updated', (payload) => {
        const { data } = payload || {};
        if (!data || !data.team) return;
        setStats((prev) => {
          if (!prev) return prev;
          const updatedTeams = (prev.teams || []).map(t =>
            t.TeamID === data.teamId ? data.team : t
          );
          return { ...prev, teams: updatedTeams };
        });
      });

      const unsubTeamDeleted = subscribe('team.deleted', (payload) => {
        const { data } = payload || {};
        if (!data || !data.team) return;
        setStats((prev) => {
          if (!prev) return prev;
          const updatedTeams = (prev.teams || []).filter(t => t.TeamID !== data.teamId);
          return { ...prev, teams: updatedTeams, totalTeams: updatedTeams.length };
        });
      });

      const unsubTeamStatusUpdated = subscribe('team.status.updated', (payload) => {
        const { data } = payload || {};
        if (!data || !data.team) return;
        setStats((prev) => {
          if (!prev) return prev;
          const updatedTeams = (prev.teams || []).map(t =>
            t.TeamID === data.teamId ? data.team : t
          );
          return { ...prev, teams: updatedTeams };
        });
      });

      return () => {
        unsubPresence && unsubPresence();
        unsubUpdated && unsubUpdated();
        unsubRemoved && unsubRemoved();
        unsubMetrics && unsubMetrics();
        unsubTeamCreated && unsubTeamCreated();
        unsubTeamUpdated && unsubTeamUpdated();
        unsubTeamDeleted && unsubTeamDeleted();
        unsubTeamStatusUpdated && unsubTeamStatusUpdated();
      };
    }
  }, [userDetails?.organizationID, userDetails?.role]);

  const handleRemoveUser = async (userId) => {
    setRemovingUser(userId);
    try {
      await api.patch(`/users/${userId}/remove-from-org`, {
        ModifiedBy: userDetails._id
      });
      const response = await api.get(`/dashboard/${userDetails.organizationID}`);
      setStats(response.data);
    } catch (err) {
      setError('Failed to remove member from organization');
      console.error(err);
    } finally {
      setRemovingUser(null);
      setShowRemoveDialog(false);
    }
  };

  const handleProjectStatusUpdate = async (projectId, newStatusId) => {
    try {
      await projectService.updateProject(projectId, { ProjectStatusID: newStatusId });

      // Update the local stats to reflect the change
      setStats(prevStats => ({
        ...prevStats,
        recentProjects: prevStats.recentProjects.map(project =>
          project.id === projectId
            ? {
              ...project,
              projectStatusId: newStatusId,
              projectStatus: getProjectStatus(newStatusId).Value
            }
            : project
        )
      }));

      showToast('Project status updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update project status', 'error');
      console.error('Error updating project status:', err);
      throw err; // Re-throw to let the dropdown component handle the error
    }
  };

  const handleResendInvite = async (inviteId) => {
    try {
      const res = await userService.resendInvite(inviteId);
      if (res.success) {
        showToast('Invite resent successfully!', 'success');
        setStats((prev) => ({
          ...prev,
          invites: (prev?.invites || []).map(invite =>
            invite._id === inviteId ? res.invite : invite
          )
        }));
      } else {
        showToast(res.message || 'Failed to resend invite', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to resend invite', 'error');
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    try {
      const res = await userService.deleteInvite(inviteId);
      if (res.success) {
        showToast('Invite deleted successfully!', 'success');
        setStats((prev) => ({
          ...prev,
          invites: prev.invites.filter(invite => invite._id !== inviteId)
        }));
      } else {
        showToast(res.message || 'Failed to delete invite', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete invite', 'error');
    }
  };

  const getInviteStatusBadge = (invite) => {
    const now = new Date();
    const isExpired = invite.expiredAt && new Date(invite.expiredAt) < now;

    if (invite.status === 'Accepted') {
      return { textColor: 'text-green-700', bgColor: 'from-green-50 to-green-100', text: 'Accepted', borderColor: 'border-green-200', icon: FcAcceptDatabase, iconColor: 'text-green-500' };
    } else if (invite.status === 'Expired' || isExpired) {
      return { textColor: 'text-red-700', bgColor: 'from-red-50 to-red-100', text: 'Expired', borderColor: 'border-red-200', icon: FcExpired, iconColor: 'text-red-500' };
    } else {
      return { textColor: 'text-yellow-700', bgColor: 'from-yellow-50 to-yellow-100', text: 'Pending', borderColor: 'border-yellow-200', icon: FaClock, iconColor: 'text-yellow-500' };
    }
  };


  const getTimeUntilExpiry = (expiryDate) => {
    if (!expiryDate) return 'N/A';
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Less than 1h';
  };

  // Modular widgets rendering




  const renderWidgetContent = (id) => {
    switch (id) {
      case 'analytics':
        return DashboardCharts ? (
          <DashboardCharts
            stats={stats}
            theme={theme}
            userDetails={userDetails}
            tasks={tasksDetails || []}
            setTasks={setTasksDetails}
          />
        ) : (
          <div className={`bg-white text-gray-900 border-gray-200 rounded-xl shadow-sm border p-6 dark:bg-transparent dark:text-[#F3F6FA] dark:border-gray-700 dark:rounded-xl dark:border dark:p-6`}>
            <h3 className="text-lg font-semibold mb-4">Dashboard Analytics</h3>
            <p className="text-sm text-slate-600">Analytics charts are currently unavailable.</p>
          </div>
        );


      default:
        return null;
    }
  };

  if (userDetails && !userDetails.onboardingCompleted) {
    return (
      <>
        <Head>
          <title>First Time Setup | TeamLabs</title>
        </Head>
        <div className="mx-auto my-4">
          <FirstTimeSetup onComplete={() => router.reload()} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-8">{error}</div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | TeamLabs</title>
      </Head>
      <div className="mx-auto">
        {/* Onboarding Guide Modal */}
        <OnboardingGuide
          isOpen={showOnboardingGuide}
          onClose={() => setShowOnboardingGuide(false)}
        />

        {/* Tab Navigation */}
        {!shouldShowWelcomeMessage && (
          <div className="mb-6">
            <div className={`border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-none`}>
              <nav className="-mb-px flex items-center justify-between min-w-max w-full pb-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('whats_up')}
                    className={`${activeTab === 'whats_up'
                      ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/80 shadow-sm'
                      : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-zinc-800/50'
                      } whitespace-nowrap px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 group relative`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${activeTab === 'whats_up' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    <span>What's Up</span>
                    {activeTab === 'whats_up' && (
                      <div className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className={`${activeTab === 'metrics'
                      ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/80 shadow-sm'
                      : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-zinc-800/50'
                      } whitespace-nowrap px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 group relative`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${activeTab === 'metrics' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span>Metrics & Analytics</span>
                    {activeTab === 'metrics' && (
                      <div className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className={`${activeTab === 'manage'
                      ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/80 shadow-sm'
                      : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-zinc-800/50'
                      } whitespace-nowrap px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 group relative`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${activeTab === 'manage' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Manage Organization</span>
                    {activeTab === 'manage' && (
                      <div className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
                    )}
                  </button>
                </div>

                {/* Customize Button at the right end of the tabs row */}
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0 pb-3">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={resetLayout}
                        className={`px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all duration-200 border-slate-200 hover:bg-slate-100 text-slate-650 hover:text-slate-900 text-slate-600 bg-white shadow-sm dark:border-white/10 dark:hover:bg-slate-800 dark:text-slate-400 dark:bg-slate-900/30`}
                      >
                        <FaUndo size={11} /> Reset Defaults
                      </button>
                      <button
                        onClick={() => setIsEditMode(false)}
                        className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-1.5 transition-all duration-200 shadow-md shadow-emerald-600/10"
                      >
                        <FaCheck size={11} /> Save & Exit
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className={`px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all duration-200 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-600 bg-white shadow-sm dark:border-white/10 dark:hover:bg-slate-800 dark:hover:text-white dark:text-slate-400 dark:bg-slate-900/50`}
                    >
                      <FaWrench size={11} /> Customize
                    </button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Setup Guide Button - Now positioned prominently below tabs */}
        {/* Welcome Message for Admins with zero teams and projects */}
        {shouldShowWelcomeMessage && (
          <AdminWelcomeMessage onOpenSetupGuide={() => setShowOnboardingGuide(true)} onOpenInvite={() => setShowInviteModal(true)} />
        )}

        {/* Tab Content */}
        {!shouldShowWelcomeMessage && activeTab === 'whats_up' && (
          <div className="space-y-2 px-4">
            {/* What's Up Personalized Greeting Banner */}
            <div className="pb-2 transition-all duration-300 relative overflow-hidden ">
              {(() => {
                const now = new Date();
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = days[now.getDay()];
                const months = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ];
                function getOrdinalSuffix(day) {
                  if (day > 3 && day < 21) return "th";
                  switch (day % 10) {
                    case 1: return "st";
                    case 2: return "nd";
                    case 3: return "rd";
                    default: return "th";
                  }
                }
                const monthName = months[now.getMonth()];
                const dateString = `${monthName} ${now.getDate() + getOrdinalSuffix(now.getDate())}`;

                const hour = now.getHours();
                let greeting = 'Hello';
                if (hour < 12) {
                  greeting = 'Good Morning';
                } else if (hour < 18) {
                  greeting = 'Good Afternoon';
                } else {
                  greeting = 'Good Evening';
                }
                const firstName = userDetails?.firstName || '';

                return (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className={`text-xs text-gray-500 dark:text-gray-400`}>
                        {dayName}, {dateString}
                      </div>
                      <h1 className={`text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mt-1 text-gray-800 dark:text-white`}>
                        {greeting}! {firstName}, you have{' '}
                        <span className="text-primary dark:text-blue-400 font-bold">{whatsUpData?.todosCount || 0} to-dos</span> and{' '}
                        <span className="text-primary dark:text-blue-400 font-bold">{whatsUpData?.topicsCount || 0} topics</span> to catch up on.
                      </h1>
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full self-start sm:self-center bg-gray-100 text-gray-500 dark:bg-dark-bg dark:text-zinc-400 dark:border dark:border-zinc-800`}>
                      <span>Updated just now</span>
                      <button
                        onClick={() => {
                          mutateWhatsUp();
                          showToast('Refreshed!', 'success');
                        }}
                        className="hover:text-blue-500 transition-colors"
                        title="Refresh data"
                      >
                        <FaRedo className="animate-hover" size={10} />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Suggested to-dos & Topics / Updates grid */}
            <div className="w-full flex flex-col lg:flex-row gap-6">

              {/* Left Column: My Tasks */}
              <div className={`w-full lg:w-[20%] p-6 rounded-3xl border bg-white border-gray-200 shadow-sm dark:bg-dark-bg dark:border-dark-border flex flex-col`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold tracking-tight text-gray-900 dark:text-white`}>
                    My Tasks
                  </h2>
                  <button
                    onClick={() => openAddTaskModal({ mode: 'fromSideBar', onSuccess: mutateWhatsUp })}
                    className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-white`}
                  >
                    <FaPlus size={12} />
                  </button>
                </div>

                {/* Day selector tags */}
                <div className="flex gap-2 mb-6">
                  <button
                    className={`px-5 py-2 text-xs font-semibold rounded-full border transition-all duration-200 bg-zinc-950 text-white border-zinc-950 font-bold shadow-md dark:bg-white dark:text-zinc-900 dark:border-white dark:font-bold dark:shadow-sm`}
                  >
                    Ongoing
                  </button>
                </div>

                {/* Status Dropdown Filter */}
                <div className="relative mb-4">
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all bg-white border-gray-200 hover:bg-gray-50 text-gray-800 dark:bg-dark-card dark:border-dark-border dark:hover:bg-dark-hover dark:text-white`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-primary text-white dark:bg-dark-border dark:text-light`}>
                        {filteredMyTasks.length}
                      </span>
                      <span className={`text-xs sm:text-sm font-semibold text-gray-700 dark:text-light`}>
                        {statusOptions.find(opt => opt.code === selectedTaskStatus)?.value}
                      </span>
                    </div>
                    <FaChevronDown
                      size={11}
                      className={`text-zinc-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {isStatusDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                      <div className={`absolute left-0 right-0 mt-1.5 rounded-2xl border shadow-xl z-20 overflow-hidden bg-white border-gray-200 text-gray-800 dark:bg-dark-card dark:border-dark-border dark:text-white`}>
                        {statusOptions.map((option) => {
                          const count = (whatsUpData?.todos || []).filter(t => {
                            if (option.code === 'all') return true;
                            const tStatus = String(t.Status).toLowerCase();
                            const optionStatus = taskStatuses.find(s => s.Code === Number(option.code));
                            const optionVal = optionStatus ? optionStatus.Value.toLowerCase() : '';
                            return tStatus === String(option.code) || tStatus === optionVal;
                          }).length;

                          return (
                            <button
                              key={option.code}
                              type="button"
                              onClick={() => {
                                setSelectedTaskStatus(option.code);
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 text-xs sm:text-sm text-left transition-colors ${selectedTaskStatus === option.code
                                ? 'bg-gray-100 dark:bg-dark-hover text-primary font-semibold'
                                : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover'
                                }`}
                            >
                              <span>{option.value}</span>
                              <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-500 dark:bg-dark-border dark:text-light`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Tasks List */}
                <div className="flex flex-col">
                  <div className="space-y-4">
                    {whatsUpLoading ? (
                      <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-24 bg-gray-200 dark:bg-zinc-850 rounded-2xl" />
                        ))}
                      </div>
                    ) : filteredMyTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-zinc-400 dark:text-zinc-500 italic text-xs sm:text-sm">
                          No tasks scheduled.
                        </p>
                      </div>
                    ) : (
                      filteredMyTasks.map((todo, index) => {
                        const scheme = getTaskTypeScheme(todo.Type);
                        const projectNameLower = (todo.ProjectName || '').toLowerCase();
                        let brandIcon = <FaTasks size={12} />;
                        if (projectNameLower.includes('github') || projectNameLower.includes('git')) {
                          brandIcon = <FaGithub size={12} />;
                        } else if (projectNameLower.includes('gitlab')) {
                          brandIcon = <FaGitlab size={12} />;
                        } else if (projectNameLower.includes('9tdesign') || projectNameLower.includes('mobile')) {
                          brandIcon = <span className="text-xs font-bold font-mono">9D</span>;
                        } else if (projectNameLower.includes('horizon')) {
                          brandIcon = <span className="text-xs font-bold font-mono">H</span>;
                        } else {
                          const initials = (todo.ProjectName || 'P')
                            .split(' ')
                            .map(w => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase();
                          brandIcon = <span className="text-xs font-bold font-mono">{initials}</span>;
                        }

                        return (
                          <div
                            key={todo.TaskID}
                            className={`p-4 rounded-2xl border ${scheme.bg} ${scheme.border} flex flex-col gap-3 relative transition-all duration-200 hover:shadow-md`}
                          >
                            <div className="flex items-start justify-between w-full">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${scheme.accent} mt-0.5`}>
                                {brandIcon}
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <button
                                  onClick={() => handleMarkDone(todo.TaskID)}
                                  className="w-6 h-6 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-green-600 hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all duration-150 shadow-sm"
                                >
                                  <FaCheck size={9} />
                                </button>
                                {getPriorityBadge(todo.Priority) && (
                                  <div className="scale-90 origin-right">
                                    {getPriorityBadge(todo.Priority)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <h4
                                onClick={() => router.push(`/task/${todo.TaskID}`)}
                                className={`text-sm font-bold tracking-tight cursor-pointer hover:underline text-zinc-900 dark:text-white`}
                              >
                                {todo.Name}
                              </h4>
                              {todo.Description && (
                                <p className={`text-xs text-zinc-550 dark:text-zinc-400 line-clamp-2`}>
                                  {todo.Description.replace(/<[^>]*>/g, '')}
                                </p>
                              )}
                            </div>

                            {/* Extra Info Row */}
                            <div className="flex items-center justify-between gap-x-3 gap-y-1.5 pt-2.5 mt-1 border-t border-dashed border-zinc-200/60 dark:border-zinc-800/40 text-xs text-zinc-500 dark:text-zinc-400 w-full">
                              {/* Left block: ProjectName, Due */}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                {/* Project Tag */}
                                <span className="flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-300">
                                  <FaProjectDiagram size={10} className="text-zinc-400 dark:text-zinc-500" />
                                  {todo.ProjectName}
                                </span>

                                <span>•</span>

                                {/* Due Date Tag */}
                                {todo.DueDate ? (
                                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                                    <FaCalendarAlt size={10} />
                                    {new Date(todo.DueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 dark:text-zinc-500 italic">No due date</span>
                                )}
                              </div>

                              {/* Right block: Comments, Files */}
                              <div className="flex items-center gap-2">
                                {/* Comment Count Tag */}
                                <span className="flex items-center gap-1" title={`${todo.commentCount || 0} comments`}>
                                  <FaComments size={11} className="text-zinc-400 dark:text-zinc-500" />
                                  {todo.commentCount || 0}
                                </span>

                                <span>•</span>

                                {/* File Count Tag */}
                                <span className="flex items-center gap-1" title={`${todo.fileCount || 0} attachments`}>
                                  <FaPaperclip size={10} className="text-zinc-400 dark:text-zinc-500" />
                                  {todo.fileCount || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Column: Suggested to-dos & Timeline */}
              <div className="w-full lg:w-[58%] space-y-6">

                {/* Suggested to-dos Card */}
                <div className={`p-6 rounded-3xl border bg-white border-gray-200 shadow-sm dark:bg-dark-bg dark:border-dark-border`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-bold tracking-tight text-gray-900 dark:text-white`}>
                      Suggested to-dos
                    </h2>

                    {!whatsUpLoading && whatsUpData?.todos?.length > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300`}>
                        {whatsUpData.todos.length} left
                      </span>
                    )}
                  </div>

                  {/* Catch-up progress bar feedback */}
                  {!whatsUpLoading && sessionCompletedCount > 0 && (
                    <div className="mb-4 p-3 rounded-xl border flex flex-col gap-1.5 animate-fade-in bg-green-50/50 border-green-100 dark:bg-green-950/10 dark:border-green-900/30">
                      <div className="flex justify-between items-center text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                        <span>Caught up Progress</span>
                        <span>{sessionCompletedCount} Done</span>
                      </div>
                      <div className="w-full h-1 bg-green-200/50 dark:bg-green-955/20 dark:bg-green-950 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  )}

                  {/* Filter Tabs */}
                  {!whatsUpLoading && whatsUpData?.todos?.length > 0 && (
                    <div className="max-w-sm flex rounded-lg p-0.5 border text-xs font-medium mb-4 border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/30">
                      <button
                        onClick={() => setTodoFilter('all')}
                        className={`flex-1 py-1 rounded text-center transition-all ${todoFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                      >
                        All ({(whatsUpData?.todos || []).length})
                      </button>
                      <button
                        onClick={() => setTodoFilter('high')}
                        className={`flex-1 py-1 rounded text-center transition-all ${todoFilter === 'high'
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                      >
                        High ({(whatsUpData?.todos || []).filter(t => t.Priority === 0 || t.Priority === 1).length})
                      </button>
                      <button
                        onClick={() => setTodoFilter('due')}
                        className={`flex-1 py-1 rounded text-center transition-all ${todoFilter === 'due'
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                      >
                        Due Soon ({(whatsUpData?.todos || []).filter(t => t.DueDate).length})
                      </button>
                    </div>
                  )}

                  {whatsUpLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-zinc-850 rounded-xl" />
                      ))}
                    </div>
                  ) : !whatsUpData?.todos?.length ? (
                    <div className="text-center py-8">
                      <p className="text-zinc-500 dark:text-zinc-400 italic">No suggested to-dos. You are all caught up!</p>
                    </div>
                  ) : (() => {
                    const todosToRender = whatsUpData.todos
                      .filter(t => {
                        if (todoFilter === 'high') return t.Priority === 0 || t.Priority === 1;
                        if (todoFilter === 'due') return !!t.DueDate;
                        return true;
                      });

                    if (todosToRender.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-zinc-500 dark:text-zinc-400 italic text-sm">No to-dos matching this filter.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        {todosToRender.slice(0, showAllTodos ? undefined : 5).map((todo) => {
                          const isAnimating = animatingTaskIds.includes(todo.TaskID);
                          const isOverdue = todo.DueDate ? new Date(todo.DueDate) < new Date() : false;

                          let dueDateLabel = '';
                          let dueDateColor = 'text-gray-500 dark:text-zinc-400';
                          if (todo.DueDate) {
                            const dateObj = new Date(todo.DueDate);
                            const options = { month: 'short', day: 'numeric' };
                            const formatted = dateObj.toLocaleDateString(undefined, options);
                            if (isOverdue) {
                              dueDateLabel = `Overdue • ${formatted}`;
                              dueDateColor = 'text-red-500 font-semibold';
                            } else {
                              dueDateLabel = `Due ${formatted}`;
                            }
                          }

                          const scheme = getTaskTypeScheme(todo.Type);

                          return (
                            <div
                              key={todo.TaskID}
                              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all duration-200 hover:shadow-md ${isAnimating ? 'opacity-30 scale-95' : ''
                                } ${scheme.bg} ${scheme.border}`}
                            >
                              <div
                                onClick={() => handleCheckboxClick(todo.TaskID)}
                                className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-200 group shrink-0 ${isAnimating
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300 bg-white hover:border-green-500 hover:bg-green-50/30 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-green-500 dark:hover:bg-green-950/20'
                                  }`}
                                title="Mark as completed"
                              >
                                <FaCheck
                                  size={10}
                                  className={`transition-all duration-200 ${isAnimating
                                    ? 'text-white opacity-100 scale-100'
                                    : 'text-green-500 opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'
                                    }`}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    onClick={() => router.push(`/task/${todo.TaskID}`)}
                                    className={`text-sm font-bold truncate hover:underline cursor-pointer text-zinc-900 dark:text-white`}
                                  >
                                    {todo.Name}
                                  </span>
                                  {todo.Type && getTaskTypeBadge(todo.Type)}
                                </div>

                                <div className="flex items-center gap-2.5 mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                                  <span className="font-semibold text-blue-500 dark:text-blue-400">{todo.ProjectName}</span>
                                  {getPriorityBadge(todo.Priority) && (
                                    <>
                                      <span>•</span>
                                      {getPriorityBadge(todo.Priority)}
                                    </>
                                  )}
                                  {todo.DueDate && (
                                    <>
                                      <span>•</span>
                                      <span className={`flex items-center gap-1 ${dueDateColor}`}>
                                        <FaCalendarAlt size={9} />
                                        <span>{dueDateLabel}</span>
                                      </span>
                                    </>
                                  )}
                                  {todo.commentCount > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <FaComments size={9} />
                                        <span>{todo.commentCount}</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {todosToRender.length > 5 && (
                          <div className="pt-2 flex justify-center">
                            <button
                              onClick={() => setShowAllTodos(!showAllTodos)}
                              className={`flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-xl transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700`}
                            >
                              {showAllTodos ? (
                                <>
                                  <FaChevronUp size={10} />
                                  <span>Show less</span>
                                </>
                              ) : (
                                <>
                                  <FaChevronDown size={10} />
                                  <span>Show more</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Timeline / What's Ahead */}
                <div className={`p-6 rounded-3xl border bg-white border-gray-200 shadow-sm dark:bg-dark-bg dark:border-dark-border`}>
                  <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-gray-500 dark:text-zinc-400`}>
                    <FaClock className="text-blue-500" />
                    <span>What's Ahead (Timeline)</span>
                  </h3>

                  {whatsUpLoading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-6 bg-gray-200 dark:bg-dark-hover w-1/3 rounded" />
                      <div className="h-12 bg-gray-200 dark:bg-dark-hover rounded-xl" />
                    </div>
                  ) : !whatsUpData?.timeline?.length ? (
                    <div className="text-center py-6">
                      <p className="text-zinc-500 dark:text-zinc-400 italic text-sm">No upcoming deadlines.</p>
                    </div>
                  ) : (
                    <div className="relative border-l border-zinc-200 dark:border-dark-border ml-3 pl-6 space-y-6">
                      {whatsUpData.timeline.map((task) => {
                        const daysRemaining = Math.ceil(
                          (new Date(task.DueDate) - new Date()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <div key={task.TaskID} className="relative">
                            <span className="absolute -left-[32px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white dark:ring-dark-bg" />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <h4 className={`text-sm font-bold text-gray-900 dark:text-white`}>
                                  {task.Name}
                                </h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  Project: <strong className="text-blue-500">{task.ProjectName}</strong>
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${daysRemaining <= 1
                                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
                                  : daysRemaining <= 3
                                    ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800'
                                    : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800'
                                  }`}>
                                  {daysRemaining <= 0 ? 'Due today' : `Due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`} ({new Date(task.DueDate).toLocaleDateString()})
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Meetings & Support Tickets */}
              <div className={`w-full lg:w-[22%] p-6 rounded-3xl border space-y-4 bg-white border-gray-200 shadow-sm dark:bg-dark-bg dark:border-dark-border dark:text-white`}>

                {/* My Meetings Card Content */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className={`text-xl font-bold tracking-tight text-gray-900 dark:text-white`}>
                      My Meetings
                    </h2>
                    <button className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-white`}>
                      <FaCalendarAlt size={12} />
                    </button>
                  </div>

                  {whatsUpLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2].map(i => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-dark-hover rounded-2xl" />
                      ))}
                    </div>
                  ) : !whatsUpData?.myMeetings?.length ? (
                    <div className="text-center py-6 border border-dashed border-gray-200 dark:border-dark-border rounded-2xl">
                      <p className="text-zinc-500 dark:text-zinc-400 italic text-xs">No meetings scheduled.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                      {whatsUpData.myMeetings.map((meeting) => {
                        const isGoogleMeet = !!meeting.googleMeetLink;
                        const meetingDays = calculateMeetingDays(meeting.startTime);
                        const isPast = meetingDays.status === 'past' || meetingDays.status === 'yesterday';
                        const status = getDeadlineStatusComponent(isPast ? 'Overdue' : meetingDays.text);
                        return (
                          <div
                            key={meeting.id || meeting.meetingId}
                            className={`p-4 rounded-2xl border flex flex-col gap-3.5 transition-all duration-200 hover:shadow-md bg-indigo-50/20 dark:bg-indigo-950/5 border-indigo-100/60 dark:border-indigo-950/20 hover:border-indigo-200/80 dark:hover:border-indigo-900/40`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-4">
                                {/* Left time/date badge */}
                                <div className={`px-2.5 py-1.5 rounded-xl border text-center shrink-0 min-w-[54px] bg-indigo-100/40 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30 shadow-sm`}>
                                  <span className="block text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider">
                                    {formatMeetingDate(meeting.startTime)}
                                  </span>
                                  <span className={`block text-xs font-black mt-0.5 text-indigo-900 dark:text-white`}>
                                    {formatTime(meeting.startTime)}
                                  </span>
                                </div>

                                {/* Title & Badge */}
                                <div className="flex flex-col min-w-0 pr-1">
                                  <h4
                                    onClick={() => router.push(`/timesheet`)}
                                    className={`text-sm font-bold tracking-tight cursor-pointer hover:underline truncate text-gray-900 dark:text-white`}
                                  >
                                    {meeting.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                                    {isGoogleMeet ? (
                                      <div className="flex items-center gap-1">
                                        <GoogleMeetLogo />
                                        <span className="font-bold text-slate-600 dark:text-zinc-400">Meet</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <ZoomLogo />
                                        <span className="font-bold text-slate-600 dark:text-zinc-400">Zoom</span>
                                      </div>
                                    )}
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor} ${!isPast ? 'animate-pulse' : ''}`}></span>
                                      {status.text}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Diagonal Arrow link */}
                              {meeting.googleMeetLink ? (
                                <a
                                  href={meeting.googleMeetLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="pt-0.5 transform hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform shrink-0"
                                >
                                  <DiagonalArrow />
                                </a>
                              ) : (
                                <button
                                  onClick={() => router.push(`/timesheet`)}
                                  className="pt-0.5 transform hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform shrink-0"
                                >
                                  <DiagonalArrow />
                                </button>
                              )}
                            </div>

                            {/* Description Snippet & Host Details */}
                            <div className="space-y-3.5">
                              {meeting.description && (
                                <p className={`text-xs leading-relaxed line-clamp-2 pl-0.5 text-zinc-550 dark:text-zinc-400`}>
                                  {meeting.description}
                                </p>
                              )}

                              {/* Extra Info Row */}
                              <div className="flex items-center justify-between gap-x-3 gap-y-1.5 pt-2.5 mt-1 border-t border-dashed border-zinc-200/60 dark:border-zinc-800/40 text-xs text-zinc-500 dark:text-zinc-400 w-full">
                                {meeting.organizer && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Host:</span>
                                    <span className={`text-xs font-bold text-slate-700 dark:text-zinc-300`}>
                                      {meeting.organizer.name || meeting.organizer.username}
                                    </span>
                                  </div>
                                )}

                                {/* Attendees bubbles */}
                                {meeting.attendees && meeting.attendees.length > 0 && (
                                  <div className="flex items-center gap-1.5 ml-auto">
                                    <div className="flex -space-x-1.5 overflow-hidden">
                                      {meeting.attendees.slice(0, 3).map((att, i) => {
                                        const initials = `${att.name?.[0] || att.username?.[0] || ''}`.toUpperCase();
                                        const colors = [
                                          'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500'
                                        ];
                                        const color = colors[att.username?.charCodeAt(0) % colors.length || 0];
                                        return (
                                          <div
                                            key={i}
                                            title={att.name || att.username}
                                            className={`w-5 h-5 rounded-full ${color} text-white flex items-center justify-center text-[9px] font-black border border-white dark:border-zinc-800`}
                                          >
                                            {initials}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {meeting.attendees.length > 3 && (
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">
                                        +{meeting.attendees.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-4 flex justify-start">
                    <button
                      onClick={() => router.push('/timesheet')}
                      className={`text-xs font-bold transition-colors flex items-center gap-1.5 hover:text-blue-500 text-slate-800 dark:text-zinc-300 dark:hover:text-white`}
                    >
                      <span>See All Meetings</span>
                      <span className="text-xs font-black">&gt;</span>
                    </button>
                  </div>
                </div>

                {/* Open Tickets Card Content */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className={`text-xl font-bold tracking-tight text-gray-900 dark:text-white`}>
                      Open Tickets
                    </h2>
                    <button className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-white`}>
                      <FaSlidersH size={12} />
                    </button>
                  </div>

                  {whatsUpLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2].map(i => (
                        <div key={i} className="h-24 bg-gray-200 dark:bg-dark-hover rounded-2xl" />
                      ))}
                    </div>
                  ) : !whatsUpData?.supportTickets?.length ? (
                    <div className="text-center py-6 border border-dashed border-gray-200 dark:border-dark-border rounded-2xl">
                      <p className="text-zinc-500 dark:text-zinc-400 italic text-xs">No open support tickets.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[575px] overflow-y-auto pr-1">
                      {[...whatsUpData.supportTickets].sort((a, b) => {
                        const pA = a.priority !== undefined ? Number(a.priority) : 99;
                        const pB = b.priority !== undefined ? Number(b.priority) : 99;
                        return pA - pB;
                      }).map((ticket) => {
                        const initials = `${ticket.name[0] || ''}${ticket.name.split(' ')[1]?.[0] || ''}`.toUpperCase() || 'ST';

                        const gradients = [
                          'from-blue-400 to-indigo-500',
                          'from-purple-400 to-pink-500',
                          'from-green-400 to-teal-500',
                          'from-orange-400 to-red-500',
                          'from-indigo-400 to-cyan-500'
                        ];
                        const gradientIndex = ticket.name.charCodeAt(0) % gradients.length;
                        const selectedGradient = gradients[gradientIndex];

                        return (
                          <div
                            key={ticket.id}
                            className={`p-4 rounded-2xl border flex items-start gap-4 transition-all duration-200 hover:shadow-md bg-orange-50/20 border-orange-100/60 hover:border-orange-200/80 dark:bg-dark-bg/60 dark:border-dark-border dark:hover:border-orange-900/40`}
                          >
                            {/* Avatar placeholder circle matching Jacob/Luke/Connor style */}
                            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-orange-600 bg-orange-100/40 dark:text-orange-400 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/30 shrink-0 shadow-sm">
                              {initials}
                            </div>

                            {/* Main content block */}
                            <div className="flex-1 flex flex-col items-start min-w-0">
                              <div className="flex items-center gap-2 flex-wrap w-full">
                                <h4
                                  onClick={() => {
                                    if (ticket.taskId) {
                                      router.push(`/task/${ticket.taskId}`);
                                    } else {
                                      router.push(`/tasks?search=${ticket.ticketNumber}`);
                                    }
                                  }}
                                  className={`text-sm font-bold tracking-tight cursor-pointer hover:underline truncate text-gray-900 dark:text-white`}
                                >
                                  {ticket.name}
                                </h4>
                                {ticket.ticketNumber && (
                                  <span className="text-xs text-orange-500 font-bold shrink-0">
                                    - #{ticket.ticketNumber}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-1 leading-relaxed line-clamp-2 text-zinc-600 dark:text-zinc-300`}>
                                {ticket.description.length < 30 ? ticket.description : ticket.description.substring(0, 30) + '...'}
                              </p>

                              {/* Extra Info Divider & Action */}
                              <div className="flex items-center justify-between gap-x-3 gap-y-1.5 pt-2.5 mt-2.5 border-t border-dashed border-zinc-200/60 dark:border-zinc-800/40 text-xs text-zinc-500 dark:text-zinc-400 w-full">
                                {getPriorityBadge(ticket.priority) && (
                                  <span className="shrink-0 scale-90 origin-left">
                                    {getPriorityBadge(ticket.priority)}
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    if (ticket.taskId) {
                                      router.push(`/task/${ticket.taskId}`);
                                    } else {
                                      router.push(`/tasks?search=${ticket.ticketNumber}`);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border-orange-200 bg-orange-50/50 text-orange-700 hover:bg-orange-100 hover:text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/45 dark:text-orange-300 dark:hover:bg-orange-900/60 dark:hover:text-white`}
                                >
                                  <span>Check</span>
                                  <span className="text-xs font-black">&gt;</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {!shouldShowWelcomeMessage && activeTab === 'metrics' && (
          <div className="space-y-6 px-4">
            {/* Widget Catalog Panel in Edit Mode */}
            {isEditMode && (
              <div className={`p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl text-gray-800 dark:bg-dark-card dark:border-dark-border dark:text-[#F3F6FA]`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <FaCog className="animate-spin text-indigo-500 text-sm" style={{ animationDuration: '6s' }} />
                  <span>Dashboard Widget Catalog</span>
                </h3>
                <p className={`text-xs mb-4 text-slate-500 dark:text-slate-400`}>
                  Click on any hidden widget to add it back to your active dashboard workspace. You can drag and drop widgets to reorder them, or click the size icons to change grid spacing.
                </p>
                <div className="flex flex-wrap gap-2">
                  {widgets.map(w => {
                    if (w.visible) return null;
                    return (
                      <button
                        key={w.id}
                        onClick={() => toggleWidgetVisibility(w.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm dark:bg-dark-bg dark:border dark:border-dark-border dark:hover:border-zinc-500 dark:hover:bg-dark-hover dark:text-slate-300`}
                      >
                        <FaPlus size={8} /> Add {w.title}
                      </button>
                    );
                  })}
                  {widgets.every(w => w.visible) && (
                    <span className="text-xs text-slate-400 italic">All widgets are active on your workspace layout.</span>
                  )}
                </div>
              </div>
            )}

            {/* Custom Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto max-w-/4">
              {widgets.map((widget, idx) => {
                if (!widget.visible) return null;
                return (
                  <div
                    key={widget.id}
                    draggable={isEditMode}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-300 relative hover:z-30 focus-within:z-30 ${widget.colSpan === 2 ? 'md:col-span-2' : 'md:col-span-1'
                      } ${isEditMode
                        ? 'border-2 border-dashed border-indigo-500/40 rounded-3xl p-1 cursor-grab active:cursor-grabbing hover:border-indigo-500/70 group'
                        : ''
                      }`}
                  >
                    {isEditMode && (
                      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-slate-900/90 text-white rounded-lg p-1.5 shadow-md border border-white/10 backdrop-blur-md opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="cursor-grab text-slate-400 p-1 hover:text-white" title="Drag to reorder">
                          <FaGripHorizontal size={12} />
                        </div>
                        <button
                          onClick={() => toggleWidgetColSpan(widget.id)}
                          className="p-1 text-slate-400 hover:text-white"
                          title={widget.colSpan === 2 ? "Shrink to half-width" : "Expand to full-width"}
                        >
                          {widget.colSpan === 2 ? <FaCompressAlt size={12} /> : <FaExpandAlt size={12} />}
                        </button>
                        <button
                          onClick={() => toggleWidgetVisibility(widget.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Hide widget"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    )}
                    <div className={isEditMode ? 'pointer-events-none opacity-60 filter blur-[0.5px]' : ''}>
                      {renderWidgetContent(widget.id)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!shouldShowWelcomeMessage && activeTab === 'manage' && (
          <div className="space-y-6 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-visible">
              {/* Recent Projects */}
              <div className={`bg-white text-gray-900 dark:text-[#F3F6FA] overflow-visible lg:col-span-2`}>
                <h2 className={`text-xl font-semibold mb-2 text-gray-900 dark:text-[#F3F6FA]`}>Recent Projects</h2>
                <div className={`rounded-xl border border-gray-200 dark:border-gray-700`}>
                  <div className="max-h-80 overflow-y-auto overflow-x-visible rounded-xl">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10">
                        <tr className={`bg-gray-50 border-gray-200 dark:border-gray-700 dark:bg-dark-table-header border-b`}>
                          <th className="py-3 px-4 text-left ">Project</th>
                          <th className="py-3 px-4 text-left ">Deadline</th>
                          <th className="py-3 px-4 text-left ">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recentProjects?.map(project => {
                          const currentStatus = getProjectStatus(project.projectStatusId || 1);
                          return (
                            <tr key={project.id} className={`transition-colors last:border-b-0 border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-dark-hover border-b cursor-pointer`} >
                              <td className="py-2 px-4">
                                <div className="flex flex-col">
                                  <span className={`font-medium cursor-pointer hover:text-blue-500 transition-all duration-200 hover:underline text-gray-900 dark:text-[#F3F6FA]`} onClick={() => router.push(`/project/${project.id}`)}> {project.name} </span>
                                  {project.description && (
                                    <span className={`text-xs mt-1 text-gray-500 dark:text-[#B0B8C1]`}>{project.description}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-4 whitespace-nowrap">
                                <span className={`text-sm text-gray-500 dark:text-[#B0B8C1]`}> {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'} </span>
                              </td>
                              <td className="py-2 px-4">
                                <div onClick={(e) => e.stopPropagation()}>
                                  <ProjectStatusDropdown
                                    currentStatus={currentStatus}
                                    availableStatuses={projectStatuses}
                                    onStatusChange={handleProjectStatusUpdate}
                                    projectId={project.id}
                                    theme={theme}
                                    disabled={!isAdmin}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {(!stats?.recentProjects || stats.recentProjects.length === 0) && (
                          <tr>
                            <td colSpan={3} className={`text-center py-8 text-gray-400 bg-gray-50 dark:text-[#B0B8C1] dark:bg-transparent`}> No Recent Projects </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Organization Members Table */}
              <div className={`bg-white text-gray-900 dark:bg-transparent dark:text-[#F3F6FA]`}>
                <h2 className={`text-xl font-semibold mb-2 text-gray-900 dark:text-[#F3F6FA]`}>Organization Members</h2>
                <div className={`rounded-xl border border-gray-200 dark:border-gray-700`}>
                  <div className="max-h-80 overflow-y-auto rounded-xl">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10">
                        <tr className={`bg-gray-50 border-gray-200 dark:bg-dark-table-header dark:border-gray-700 border-b`}>
                          <th className="py-3 px-4 text-left">Member</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-left ">Role</th>
                          {isAdmin && <th className="py-3 px-4 text-center">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.members?.map(member => {
                          return (
                            <tr key={member.id} className={`transition-colors last:border-b-0 border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-dark-hover border-b`}>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200`}> {member.name.split(' ').map(n => n[0]).join('')} </div>
                                  <div className="flex flex-col">
                                    <span className={`font-medium text-gray-900 dark:text-[#F3F6FA]`}> {member.name} </span>
                                    <div className="flex flex-col gap-0.5">
                                      <span className={`text-xs text-gray-500 dark:text-[#B0B8C1]`}> <strong>{member.username}</strong> | {member.email} </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {getMemberStatusBadgeComponent(member.status)}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`text-sm text-gray-900 dark:text-[#F3F6FA]`}> {member.role} </span>
                              </td>
                              {isAdmin && userDetails.organizationID && (
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setRemovingUser(member);
                                        setShowRemoveDialog(true);
                                      }}
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium transition text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-dark-card dark:hover:bg-red-900`}
                                      title="Remove Member"
                                    >
                                      <FaTimes size={14} />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        {(!stats?.members || stats.members.length === 0) && (
                          <tr>
                            <td colSpan={isAdmin && userDetails.organizationID ? 4 : 3} className={`text-center py-8 text-gray-400 bg-gray-50 dark:text-[#B0B8C1] dark:bg-transparent`}> No members found </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Invites Section - Only for Admins */}
            {isAdmin && userDetails.organizationID && (
              <div className={`max-w-7xl bg-white text-gray-900 dark:bg-transparent dark:text-[#F3F6FA]`}>
                <div className={`flex items-center justify-between mb-2`}>
                  <h2 className={`text-xl font-semibold text-gray-900 dark:text-[#F3F6FA] flex items-center gap-2`}>
                    Pending Invites
                  </h2>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium duration-300 rounded-lg transition-colors shadow-sm text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white`}
                    onClick={() => {
                      setInviteEmail('');
                      setInviteStatus('');
                      setShowInviteModal(true);
                    }}>
                    <FaPlus /> Invite
                  </button>
                </div>

                <div>
                  {(loading || statsLoading) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className={`rounded-xl border border-gray-200 dark:border-gray-700`}>
                      <div className="overflow-x-auto overflow-y-auto max-h-[400px] rounded-xl">
                        <table className="w-full ">
                          <thead className={`sticky top-0 z-10 bg-gray-50 dark:bg-dark-table-header`}>
                            <tr className={`border-gray-200 dark:border-gray-700 border-b`}>
                              <th className="py-3 px-4 text-left">Email</th>
                              <th className="py-3 px-4 text-left">Invited On</th>
                              <th className="py-3 px-4 text-left">Invited By</th>
                              <th className="py-3 px-4 text-left">Expires</th>
                              <th className="py-3 px-4 text-left">Status</th>
                              <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats?.invites?.map(invite => {
                              const statusBadge = getInviteStatusBadge(invite);
                              return (
                                <tr key={invite._id} className={`transition-colors last:border-b-0 border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-dark-hover border-b`}>
                                  <td className="py-3 px-4">
                                    <span className={`font-medium text-gray-900 dark:text-[#F3F6FA]`}>{invite.email}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-sm text-gray-600 dark:text-[#B0B8C1]`}>
                                      {formatDateWithTime(invite.invitedAt)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-sm text-gray-600 dark:text-[#B0B8C1]`}>
                                      {invite.inviter ? `${invite.inviter.firstName} ${invite.inviter.lastName}` : 'Unknown'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-sm text-gray-600 dark:text-[#B0B8C1]`}>
                                      {getTimeUntilExpiry(invite.expiredAt)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r ${statusBadge.bgColor} ${statusBadge.textColor} border ${statusBadge.borderColor}`}>
                                      {statusBadge.icon && <statusBadge.icon className={statusBadge.iconColor} size={14} />}
                                      {statusBadge.text}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {invite.status === 'Pending' && (
                                        <button
                                          onClick={() => handleResendInvite(invite._id)}
                                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-dark-card dark:hover:bg-blue-900`}
                                          title="Resend Invite"
                                        >
                                          <FaRedo size={14} />
                                        </button>
                                      )}
                                      {invite.status !== 'Accepted' && (
                                        <button
                                          onClick={() => handleDeleteInvite(invite._id)}
                                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-dark-card dark:hover:bg-red-900`}
                                          title="Delete Invite"
                                        >
                                          <FaTrash size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {stats?.invites?.length === 0 && (
                              <tr>
                                <td colSpan={6} className={`text-center py-8 text-gray-400 bg-gray-50 dark:text-[#B0B8C1] dark:bg-transparent`}>
                                  No invites found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Remove Member Confirmation Dialog */}
        {showRemoveDialog && removingUser && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black/50 dark:bg-black/70`}>
            <div className={`rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border bg-white border-gray-100 dark:bg-dark-card dark:border-dark-border dark:text-[#F3F6FA]`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className={`text-lg font-semibold dark:text-[#F3F6FA]`}>Remove Member</h3>
              </div>
              <p className={`mb-6 text-gray-600 dark:text-[#B0B8C1]`}>Are you sure you want to remove {removingUser.name} from the organization? They will no longer have access to organization resources.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRemoveDialog(false);
                    setRemovingUser(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl border transition-all duration-200 text-gray-600 border-gray-200 hover:bg-gray-50 dark:text-[#B0B8C1] dark:border-dark-border dark:hover:bg-dark-card`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveUser(removingUser.id)}
                  className={`px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-700 dark:to-red-900 dark:hover:from-red-800 dark:hover:to-red-900`}
                  disabled={removingUser === removingUser?.id}
                >
                  {removingUser === removingUser?.id ? 'Removing...' : 'Remove from Organization'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          organizationName={organization?.Name}
          members={(stats?.members || stats?.users || []).map(m => ({
            id: m.id || m._id,
            name: m.name || (m.firstName ? `${m.firstName} ${m.lastName || ''}`.trim() : m.username || m.email),
            email: m.email,
            role: (m.role === 'Admin' || m.role === 1) ? 'Owner' : (m.role || 'Can View'),
            avatar: m.avatar || m.profileImage || null
          }))}
          onInviteSent={() => {
            if (userDetails?.organizationID) {
              api.get(`/dashboard/${userDetails.organizationID}`).then(res => setStats(res.data)).catch(() => { });
            }
          }}
        />
      </div >
    </>
  );
};

export default Dashboard;