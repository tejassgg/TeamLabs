import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useTheme } from '../context/ThemeContext';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';
import ProjectStatusDropdown from '../components/dashboard/ProjectStatusDropdown';
import { FaTrash, FaProjectDiagram, FaChartBar, FaRedo, FaPlus, FaGripHorizontal, FaExpandAlt, FaCompressAlt, FaCog, FaTimes, FaUndo, FaWrench, FaCheck, FaClock, FaUserFriends } from 'react-icons/fa';
import { getStatusConfig } from '../components/dashboard/StatusConfig';
import api from '../services/api';
import { projectService } from '../services/api';
import { userService } from '../services/api';
import { connectSocket, subscribe } from '../services/socket';
import OnboardingGuide from '../components/dashboard/OnboardingGuide';
import AdminWelcomeMessage from '../components/dashboard/AdminWelcomeMessage';
import { FcInvite, FcAcceptDatabase, FcExpired } from "react-icons/fc";

// Modular Dashboard Widgets
import RecentCommentsWidget from '../components/dashboard/RecentCommentsWidget';
import BurndownWidget from '../components/dashboard/BurndownWidget';
import TimeTrackerWidget from '../components/dashboard/TimeTrackerWidget';
import GitStreamWidget from '../components/dashboard/GitStreamWidget';

// Dynamic import for charts
let DashboardCharts = null;

DashboardCharts = require('../components/dashboard/DashboardCharts').default

const Dashboard = () => {
  const { theme } = useTheme();
  const { projectStatuses, getProjectStatus, teams, projects, userDetails, formatDateWithTime, loading, tasksDetails, setTasksDetails } = useGlobal();
  const { showToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [removingUser, setRemovingUser] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const isAdmin = userDetails?.role === 'Admin';
  const [activeTab, setActiveTab] = useState('metrics');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const statsFetchedOrgIdRef = useRef(null);

  // Widget customization states
  const DEFAULT_WIDGETS = useMemo(() => [
    { id: 'analytics', title: 'Metrics & Analytics', visible: true, colSpan: 2 },
    { id: 'timeTracker', title: 'Personal Time Tracker', visible: true, colSpan: 1 },
    { id: 'recentComments', title: 'Recent Comments', visible: true, colSpan: 1 },
    { id: 'burndown', title: 'Task Burndown', visible: true, colSpan: 1 },
    { id: 'gitStream', title: 'GitHub Commit Stream', visible: true, colSpan: 1 },
  ], []);

  const [widgets, setWidgets] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Load layout from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dashboard_widgets_layout');
    if (stored) {
      try {
        setWidgets(JSON.parse(stored));
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

  // Check if Admin has zero teams and projects
  const shouldShowWelcomeMessage = isAdmin && teams.length === 0 && projects.length === 0;

  useEffect(() => {
    // Phase 1: connect socket and subscribe to org member presence/updates
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get(`/dashboard/${userDetails.organizationID}`);
        setStats(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard statistics');
        console.error(err);
      } finally {
        setStatsLoading(false);
      }
    };



    if (userDetails?.organizationID) {
      if (statsFetchedOrgIdRef.current === userDetails.organizationID) {
        return;
      }
      statsFetchedOrgIdRef.current = userDetails.organizationID;


      setStatsLoading(true);
      fetchDashboardStats();

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

  const handleInvite = async () => {
    setInviteStatus('');
    try {
      const res = await userService.inviteUser(inviteEmail);
      if (res.data?.success) {
        showToast('Invite sent successfully!', 'success');
        setStats((prev) => ({
          ...prev,
          invites: [...prev.invites, res.data?.invite]
        }));
        // Refresh dashboard data to get the new invite
        const response = await api.get(`/dashboard/${userDetails.organizationID}`);
        setStats(response.data);
        setInviteStatus(res.data?.message || 'Invite sent!');
        setInvitedEmails((prev) => [...prev, inviteEmail]);
      }

      setInviteEmail('');
    } catch (err) {
      setInviteStatus(err.message || 'Failed to send invite');
      showToast(err.message || 'Failed to send invite', 'error');
    }
  };

  const handleResendInvite = async (inviteId) => {
    try {
      const res = await userService.resendInvite(inviteId);
      if (res.data?.success) {
        showToast('Invite resent successfully!', 'success');
        setStats((prev) => ({
          ...prev,
          invites: prev.invites.map(invite =>
            invite._id === inviteId ? res.data?.invite : invite
          )
        }));
      } else {
        showToast(res.data?.message || 'Failed to resend invite', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to resend invite', 'error');
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    try {
      const res = await userService.deleteInvite(inviteId);
      if (res.data?.success) {
        showToast('Invite deleted successfully!', 'success');
        setStats((prev) => ({
          ...prev,
          invites: prev.invites.filter(invite => invite._id !== inviteId)
        }));
      } else {
        showToast(res.data?.message || 'Failed to delete invite', 'error');
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
          <DashboardCharts stats={stats} theme={theme} />
        ) : (
          <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border p-6' : 'bg-white text-gray-900 border-gray-200 rounded-xl shadow-sm border p-6'}`}>
            <h3 className="text-lg font-semibold mb-4">Dashboard Analytics</h3>
            <p className="text-sm text-slate-600">Analytics charts are currently unavailable.</p>
          </div>
        );
      case 'timeTracker':
        return (
          <TimeTrackerWidget
            userDetails={userDetails}
            theme={theme}
            tasks={tasksDetails || []}
            setTasks={setTasksDetails}
          />
        );
      case 'recentComments':
        return <RecentCommentsWidget organizationId={userDetails?.organizationID} theme={theme} />;
      case 'burndown':
        return (
          <BurndownWidget
            organizationId={userDetails?.organizationID}
            theme={theme}
            tasks={tasksDetails || []}
          />
        );
      case 'gitStream':
        return <GitStreamWidget organizationId={userDetails?.organizationID} theme={theme} />;


      default:
        return null;
    }
  };

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
            <div className="flex items-center justify-between gap-4 w-full">
              {(() => {
                // Get current date and time
                const now = new Date();
                // Get day of week
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = days[now.getDay()];
                // Format date as Month Day, Year
                const months = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ];
                function getOrdinalSuffix(day) {
                  if (day > 3 && day < 21) { // Handles 11th, 12th, 13th, etc.
                    return "th";
                  }
                  switch (day % 10) {
                    case 1:
                      return "st";
                    case 2:
                      return "nd";
                    case 3:
                      return "rd";
                    default:
                      return "th";
                  }
                }
                const monthName = months[now.getMonth()];
                const dateString = `${monthName} ${now.getDate() + getOrdinalSuffix(now.getDate())}`;


                // Greeting logic
                const hour = now.getHours();
                let greeting = 'Hello';
                if (hour < 12) {
                  greeting = 'Good Morning';
                } else if (hour < 18) {
                  greeting = 'Good Afternoon';
                } else {
                  greeting = 'Good Evening';
                }

                // Get user's first name
                const firstName = userDetails?.firstName || '';

                return (
                  <div className="flex flex-col mt-2">
                    <div className={`text-sm sm:text-md ${theme === 'dark' ? 'text-gray-100' : 'text-gray-500'}`}>
                      {dayName}, {dateString}
                    </div>
                    <div className={`text-xl sm:text-3xl md:text-4xl font-medium tracking-tight ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                      {greeting}! {firstName},
                    </div>
                  </div>
                );
              })()}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isEditMode ? (
                  <>
                    <button
                      onClick={resetLayout}
                      className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all duration-200 ${
                        theme === 'dark'
                          ? 'border-white/10 hover:bg-slate-800 text-slate-400 bg-slate-900/30'
                          : 'border-slate-200 hover:bg-slate-100 text-slate-600 bg-white shadow-sm'
                      }`}
                    >
                      <FaUndo size={11} /> Reset Defaults
                    </button>
                    <button
                      onClick={() => setIsEditMode(false)}
                      className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all duration-200 shadow-md shadow-emerald-600/10"
                    >
                      <FaCheck size={11} /> Save & Exit
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all duration-200 border ${
                      theme === 'dark'
                        ? 'border-white/10 hover:bg-slate-800 hover:text-white text-slate-400 bg-slate-900/50'
                        : 'border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-600 bg-white shadow-sm'
                    }`}
                  >
                    <FaWrench size={11} /> Customize
                  </button>
                )}
              </div>
            </div>
            <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <nav className="-mb-px flex items-center justify-between">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className={`${activeTab === 'metrics'
                      ? theme === 'dark'
                        ? 'border-blue-400 text-blue-400'
                        : 'border-blue-600 text-blue-600'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                  >
                    <FaChartBar size={16} />
                    <span>Metrics & Analytics</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className={`${activeTab === 'manage'
                      ? theme === 'dark'
                        ? 'border-blue-400 text-blue-400'
                        : 'border-blue-600 text-blue-600'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                  >
                    <FaProjectDiagram size={16} />
                    <span>Manage Organization</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Setup Guide Button - Now positioned prominently below tabs */}
        {/* Welcome Message for Admins with zero teams and projects */}
        {shouldShowWelcomeMessage && (
          <>
            {/* <div className="mb-6 flex justify-center">
              <button
                onClick={() => setShowOnboardingGuide(true)}
                className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 ${theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                  }`}
              >
                <FaRocket size={16} />
                <span className="font-medium">Get Started with Setup Guide</span>
              </button>
            </div> */}
            <AdminWelcomeMessage onOpenSetupGuide={() => setShowOnboardingGuide(true)} onOpenInvite={() => setShowInviteModal(true)} />
          </>
        )}

        {/* Tab Content */}
        {!shouldShowWelcomeMessage && activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Widget Catalog Panel in Edit Mode */}
            {isEditMode && (
              <div className={`p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
                theme === 'dark' 
                  ? 'bg-slate-950/70 border-white/10 shadow-slate-950/65 shadow-2xl text-[#F3F6FA]' 
                  : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl text-gray-800'
              }`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <FaCog className="animate-spin text-indigo-500 text-sm" style={{ animationDuration: '6s' }} />
                  <span>Dashboard Widget Catalog</span>
                </h3>
                <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Click on any hidden widget to add it back to your active dashboard workspace. You can drag and drop widgets to reorder them, or click the size icons to change grid spacing.
                </p>
                <div className="flex flex-wrap gap-2">
                  {widgets.map(w => {
                    if (w.visible) return null;
                    return (
                      <button
                        key={w.id}
                        onClick={() => toggleWidgetVisibility(w.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                          theme === 'dark' 
                            ? 'bg-slate-900 border border-white/5 hover:border-white/20 hover:bg-slate-800 text-slate-300' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm'
                        }`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {widgets.map((widget, idx) => {
                if (!widget.visible) return null;
                return (
                  <div
                    key={widget.id}
                    draggable={isEditMode}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-300 relative hover:z-30 focus-within:z-30 ${
                      widget.colSpan === 2 ? 'md:col-span-2' : 'md:col-span-1'
                    } ${
                      isEditMode 
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible">
              {/* Recent Projects */}
              <div className={`${theme === 'dark' ? 'text-[#F3F6FA]' : 'bg-white text-gray-900'} overflow-visible`}>
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Recent Projects</h2>
                <div className={`rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="max-h-80 overflow-y-auto overflow-x-visible rounded-xl">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10">
                        <tr className={`${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'bg-gray-50 border-gray-200'} border-b`}>
                          <th className="py-3 px-4 text-left ">Project</th>
                          <th className="py-3 px-4 text-left ">Deadline</th>
                          <th className="py-3 px-4 text-left ">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recentProjects?.map(project => {
                          const currentStatus = getProjectStatus(project.projectStatusId || 1);
                          return (
                            <tr key={project.id} className={`transition-colors last:border-b-0 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'} border-b cursor-pointer`} >
                              <td className="py-2 px-4">
                                <div className="flex flex-col">
                                  <span className={`font-medium cursor-pointer hover:text-blue-500 transition-all duration-200 hover:underline ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`} onClick={() => router.push(`/project/${project.id}`)}> {project.name} </span>
                                  {project.description && (
                                    <span className={`text-xs mt-1 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>{project.description}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-4">
                                <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}> {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'} </span>
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
                            <td colSpan={3} className={`text-center py-8 ${theme === 'dark' ? 'text-[#B0B8C1] bg-transparent' : 'text-gray-400 bg-gray-50'}`}> No Recent Projects </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Organization Members Table */}
              <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA]' : 'bg-white text-gray-900'}`}>
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Organization Members</h2>
                <div className={`rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="max-h-80 overflow-y-auto rounded-xl">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10">
                        <tr className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
                          <th className="py-3 px-4 text-left">Member</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-left">Role</th>
                          {isAdmin && <th className="py-3 px-4 text-center">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.members?.map(member => {
                          const statusConfig = getStatusConfig(member.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <tr key={member.id} className={`transition-colors last:border-b-0 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'} border-b`}>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'}`}> {member.name.split(' ').map(n => n[0]).join('')} </div>
                                  <div className="flex flex-col">
                                    <span className={`font-medium ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}> {member.name} </span>
                                    <div className="flex flex-col gap-0.5">
                                      <span className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}> <strong>{member.username}</strong> | {member.email} </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                              ${theme === 'dark'
                                    ? 'bg-transparent border border-gray-700'
                                    : 'bg-white border border-gray-200'}`}
                                >
                                  <StatusIcon className={`${statusConfig.color} text-sm`} />
                                  <span className={theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-700'}> {statusConfig.label} </span>
                                  {member.status === 'Active' && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color.replace('text', 'bg')} animate-pulse`}></span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-sm ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}> {member.role} </span>
                              </td>
                              {isAdmin && userDetails.organizationID && (
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setRemovingUser(member);
                                        setShowRemoveDialog(true);
                                      }}
                                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition ${theme === 'dark' ? 'text-red-300 bg-[#232323] hover:bg-red-900' : 'text-red-700 bg-red-100 hover:bg-red-200'}`}
                                      title="Remove Member"
                                    >
                                      <FaTrash size={14} />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        {(!stats?.members || stats.members.length === 0) && (
                          <tr>
                            <td colSpan={isAdmin && userDetails.organizationID ? 4 : 3} className={`text-center py-8 ${theme === 'dark' ? 'text-[#B0B8C1] bg-transparent' : 'text-gray-400 bg-gray-50'}`}> No members found </td>
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
              <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA]' : 'bg-white text-gray-900'}`}>
                <div className={`flex items-center justify-between mb-2`}>
                  <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'} flex items-center gap-2`}>
                    Pending Invites
                  </h2>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium duration-300 rounded-lg transition-colors shadow-sm ${theme === 'dark'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white'}`}
                    onClick={() => setShowInviteModal(true)}>
                    <FaPlus /> Invite
                  </button>
                </div>

                <div>
                  {(loading || statsLoading) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className={`rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="overflow-x-auto overflow-y-auto max-h-[400px] rounded-xl">
                        <table className="w-full ">
                          <thead className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#18181b]' : 'bg-gray-50'}`}>
                            <tr className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                              <th className="py-3 px-4 text-left">Email</th>
                              <th className="py-3 px-4 text-left">Status</th>
                              <th className="py-3 px-4 text-left">Invited By</th>
                              <th className="py-3 px-4 text-left">Invited On</th>
                              <th className="py-3 px-4 text-left">Expires</th>
                              <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats?.invites?.map(invite => {
                              const statusBadge = getInviteStatusBadge(invite);
                              return (
                                <tr key={invite._id} className={`transition-colors last:border-b-0 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'} border-b`}>
                                  <td className="py-3 px-4">
                                    <span className={`font-medium ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>{invite.email}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r ${statusBadge.bgColor} ${statusBadge.textColor} border ${statusBadge.borderColor}`}>
                                      {statusBadge.icon && <statusBadge.icon className={statusBadge.iconColor} size={14} />}
                                      {statusBadge.text}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>
                                      {invite.inviter ? `${invite.inviter.firstName} ${invite.inviter.lastName}` : 'Unknown'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>
                                      {formatDateWithTime(invite.invitedAt)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>
                                      {getTimeUntilExpiry(invite.expiredAt)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {invite.status === 'Pending' && (
                                        <button
                                          onClick={() => handleResendInvite(invite._id)}
                                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition ${theme === 'dark' ? 'text-blue-300 bg-[#232323] hover:bg-blue-900' : 'text-blue-700 bg-blue-100 hover:bg-blue-200'}`}
                                          title="Resend Invite"
                                        >
                                          <FaRedo size={14} />
                                        </button>
                                      )}
                                      {invite.status !== 'Accepted' && (
                                        <button
                                          onClick={() => handleDeleteInvite(invite._id)}
                                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition ${theme === 'dark' ? 'text-red-300 bg-[#232323] hover:bg-red-900' : 'text-red-700 bg-red-100 hover:bg-red-200'}`}
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
                                <td colSpan={6} className={`text-center py-8 ${theme === 'dark' ? 'text-[#B0B8C1] bg-transparent' : 'text-gray-400 bg-gray-50'}`}>
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
          <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme === 'dark' ? 'bg-black/70' : 'bg-black/50'}`}>
            <div className={`rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border ${theme === 'dark' ? 'bg-[#232323] border-[#424242] text-[#F3F6FA]' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : ''}`}>Remove Member</h3>
              </div>
              <p className={`mb-6 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Are you sure you want to remove {removingUser.name} from the organization? They will no longer have access to organization resources.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRemoveDialog(false);
                    setRemovingUser(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl border transition-all duration-200 ${theme === 'dark' ? 'text-[#B0B8C1] border-[#424242] hover:bg-[#232323]' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveUser(removingUser.id)}
                  className={`px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r ${theme === 'dark' ? 'from-red-700 to-red-900 hover:from-red-800 hover:to-red-900' : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'}`}
                  disabled={removingUser === removingUser?.id}
                >
                  {removingUser === removingUser?.id ? 'Removing...' : 'Remove from Organization'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme === 'dark' ? 'bg-black/70' : 'bg-black/50'}`}>
            <div className={`rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border ${theme === 'dark' ? 'bg-[#232323] border-[#424242] text-[#F3F6FA]' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : ''}`}>Invite User to Organization</h3>
              </div>
              <div className="mb-4">
                <input
                  type="email"
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-[#232323] border-[#424242] text-[#F3F6FA]' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
              </div>
              <button
                className={`w-full py-2 rounded-lg font-medium transition-all duration-200 mb-2 ${theme === 'dark' ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                onClick={handleInvite}
                disabled={!inviteEmail}
              >
                Send Invite
              </button>
              {inviteStatus && <div className="text-sm mt-2 mb-2 text-green-500">{inviteStatus}</div>}
              {invitedEmails.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-gray-400 mb-1">Invited Emails:</div>
                  <ul className="text-sm">
                    {invitedEmails.map((email, idx) => (
                      <li key={idx} className="text-blue-500">{email}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                className={`mt-4 w-full py-2 rounded-lg font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={() => { setShowInviteModal(false); setInviteStatus(''); setInviteEmail(''); }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;