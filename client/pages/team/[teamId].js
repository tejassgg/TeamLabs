import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import api, { authService, teamService, meetingService } from '../../services/api';
import CustomModal from '../../components/shared/CustomModal';
import StatusDropdown from '../../components/shared/StatusDropdown';
import { FaCog, FaTrash, FaTimes, FaPlus, FaExternalLinkAlt, FaClock, FaArrowRight, FaToggleOn, FaUsers, FaAlignLeft, FaTag, FaCalendarAlt, FaUserFriends } from 'react-icons/fa';
import { getTaskTypeBadge, getPriorityBadge } from '../../components/task/TaskTypeBadge';
import TeamDetailsSkeleton from '../../components/skeletons/TeamDetailsSkeleton';
import { subscribe } from '../../services/socket';
import Link from 'next/link';
import { useToast } from '../../context/ToastContext';
import { useThemeClasses } from '../../components/shared/hooks/useThemeClasses';
import { GoogleLogin } from '@react-oauth/google';
import StatusPill from '../../components/shared/StatusPill';

const TeamDetailsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { teamId } = router.query;
  const { teams, setTeams, getProjectStatusBadgeComponent, getProjectStatusStyle, getProjectStatus } = useGlobal();
  const { theme } = useTheme();
  const getThemeClasses = useThemeClasses();
  const { showToast } = useToast();
  const { formatDateWithTime, calculateMeetingDays } = require('../../utils/dateUtils');

  // Helper function for meeting days badge colors
  const getDaysBadgeColor = (status) => {
    switch (status) {
      case 'today':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200';
      case 'tomorrow':
        return 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200';
      case 'upcoming':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200';
      case 'yesterday':
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200';
      case 'past':
        return 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatForDatetimeLocal = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgUsers, setOrgUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSettingsModalClosing, setIsSettingsModalClosing] = useState(false);
  const [isSettingsModalOpening, setIsSettingsModalOpening] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    TeamName: '',
    TeamDescription: '',
    TeamType: '',
    TeamColor: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [teamTypes, setTeamTypes] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [togglingTeam, setTogglingTeam] = useState('');
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removing, setRemoving] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [userToAdd, setUserToAdd] = useState(null);
  const [showInactiveMemberDialog, setShowInactiveMemberDialog] = useState(false);
  const [selectedInactiveMember, setSelectedInactiveMember] = useState(null);
  const [activeProjects, setActiveProjects] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [bulkRemoving, setBulkRemoving] = useState(false);
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [bulkRemovingProjects, setBulkRemovingProjects] = useState(false);
  const [showBulkRemoveProjectsDialog, setShowBulkRemoveProjectsDialog] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [processingRequest, setProcessingRequest] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [isMeetingModalClosing, setIsMeetingModalClosing] = useState(false);
  const [isMeetingModalOpening, setIsMeetingModalOpening] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [createMeetingForm, setCreateMeetingForm] = useState({
    title: '',
    description: '',
    attendeeIds: [],
    taskIds: [],
    startTime: '',
    endTime: ''
  });
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [showMeetingDetailsModal, setShowMeetingDetailsModal] = useState(false);
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [teamTasks, setTeamTasks] = useState([]);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [showGoogleCalendarPrompt, setShowGoogleCalendarPrompt] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  const teamColors = [
    { value: '#3B82F6', name: 'Blue' },
    { value: '#10B981', name: 'Green' },
    { value: '#F59E0B', name: 'Amber' },
    { value: '#EF4444', name: 'Red' },
    { value: '#8B5CF6', name: 'Purple' },
    { value: '#EC4899', name: 'Pink' },
    { value: '#6B7280', name: 'Gray' },
  ];

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    if (teamId) {
      setLoading(true);
      api.get(`/team-details/${teamId}`)
        .then(res => {
          setTeam(res.data.team);
          setMembers(res.data.members);
          setOrgUsers(res.data.orgUsers);
          setSettingsForm({
            TeamName: res.data.team.TeamName,
            TeamType: res.data.team.TeamType,
            TeamDescription: res.data.team.TeamDescription,
            TeamColor: res.data.team.TeamColor
          });
          setActiveProjects(res.data.activeProjects || []);
          setTeamTasks(res.data.teamTasks || []);
          setMeetings(res.data.meetings || []);
          setLoadingMeetings(false);
          // Set pending requests if available
          if (res.data.pendingRequests) {
            setJoinRequests(res.data.pendingRequests);
          }
        })
        .catch(err => {
          console.error('Error fetching team:', err);
          router.push('/dashboard');
        })
        .finally(() => setLoading(false));
      setGoogleAccessToken(user?.googleCalendarAccessToken);
    }
  }, [teamId, router]);

  // Subscribe to real-time team events
  useEffect(() => {
    if (!teamId) return;

    const unsubscribeTeamUpdated = subscribe('team.updated', (data) => {
      if (data.data.teamId === teamId) {
        setTeam(data.data.team);
        // Update settings form if team name/description/type changed
        setSettingsForm(prev => ({
          ...prev,
          TeamName: data.data.team.TeamName,
          TeamType: data.data.team.TeamType,
          TeamDescription: data.data.team.TeamDescription
        }));
      }
    });

    const unsubscribeTeamStatusUpdated = subscribe('team.status.updated', (data) => {
      if (data.data.teamId === teamId) {
        setTeam(data.data.team);
      }
    });

    const unsubscribeTeamDeleted = subscribe('team.deleted', (data) => {
      if (data.data.teamId === teamId) {
        // Redirect to dashboard if team is deleted
        router.push('/dashboard');
      }
    });

    const unsubscribeMemberAdded = subscribe('team.member.added', (data) => {
      if (data.data.teamId === teamId) {
        // Add new member to the list
        const newMember = {
          MemberID: data.data.member.MemberID,
          TeamDetailsID: data.data.member.TeamDetailsID,
          IsMemberActive: data.data.member.IsMemberActive,
          name: `${data.data.user.firstName} ${data.data.user.lastName}`,
          email: data.data.user.email,
          lastLogin: null,
          CreatedDate: data.data.member.CreatedDate,
          ModifiedDate: data.data.member.ModifiedDate
        };
        setMembers(prev => [...prev, newMember]);
        // Remove user from orgUsers since they're now a member
        setOrgUsers(prev => prev.filter(u => u._id !== data.data.user._id));
      }
    });

    const unsubscribeMemberRemoved = subscribe('team.member.removed', (data) => {
      if (data.data.teamId === teamId) {
        // Remove member from the list
        setMembers(prev => prev.filter(m => m.MemberID !== data.data.memberId));
        // Add user back to orgUsers since they're no longer a member
        if (data.data.user) {
          setOrgUsers(prev => [...prev, data.data.user]);
        }
      }
    });

    const unsubscribeMemberStatusUpdated = subscribe('team.member.status.updated', (data) => {
      if (data.data.teamId === teamId) {
        // Update member status in the list
        setMembers(prev => prev.map(m =>
          m.MemberID === data.data.memberId
            ? { ...m, IsMemberActive: data.data.member.IsMemberActive }
            : m
        ));
      }
    });

    const unsubscribeMembersBulkRemoved = subscribe('team.members.bulk_removed', (data) => {
      if (data.data.teamId === teamId) {
        // Remove multiple members from the list
        setMembers(prev => prev.filter(m => !data.data.removedMemberIds.includes(m.MemberID)));
        // Add users back to orgUsers
        // Note: This would require fetching user details for all removed members
        // For now, we'll just refresh the data
        api.get(`/team-details/${teamId}`).then(res => {
          setMembers(res.data.members);
          setOrgUsers(res.data.orgUsers);
        });
      }
    });

    const unsubscribeProjectsBulkRemoved = subscribe('team.projects.bulk_removed', (data) => {
      if (data.data.teamId === teamId) {
        // Remove multiple projects from the list
        setActiveProjects(prev => prev.filter(p => !data.data.removedProjectIds.includes(p.ProjectID)));
      }
    });

    const unsubscribeJoinRequestCreated = subscribe('team.join_request.created', (data) => {
      if (data.data.teamId === teamId) {
        // Add new join request to the list
        const newRequest = {
          ...data.data.request.toObject ? data.data.request.toObject() : data.data.request,
          userId: data.data.user
        };
        setJoinRequests(prev => [...prev, newRequest]);
      }
    });

    const unsubscribeJoinRequestAccepted = subscribe('team.join_request.accepted', (data) => {
      if (data.data.teamId === teamId) {
        // Remove accepted request and refresh members
        setJoinRequests(prev => prev.filter(r => r._id !== data.data.request._id));
        api.get(`/team-details/${teamId}`).then(res => {
          setMembers(res.data.members);
          setOrgUsers(res.data.orgUsers);
        });
      }
    });

    const unsubscribeJoinRequestRejected = subscribe('team.join_request.rejected', (data) => {
      if (data.data.teamId === teamId) {
        // Remove rejected request from the list
        setJoinRequests(prev => prev.filter(r => r._id !== data.data.request._id));
      }
    });

    return () => {
      unsubscribeTeamUpdated();
      unsubscribeTeamStatusUpdated();
      unsubscribeTeamDeleted();
      unsubscribeMemberAdded();
      unsubscribeMemberRemoved();
      unsubscribeMemberStatusUpdated();
      unsubscribeMembersBulkRemoved();
      unsubscribeProjectsBulkRemoved();
      unsubscribeJoinRequestCreated();
      unsubscribeJoinRequestAccepted();
      unsubscribeJoinRequestRejected();
    };
  }, [teamId, router]);

  useEffect(() => {
    // Fetch team types from CommonTypes
    api.get('/common-types/team-types')
      .then(res => {
        setTeamTypes(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch team types:', err);
      });
  }, []);

  const isOwner = currentUser && team && currentUser._id === team.OwnerID;

  // Filter users as search changes
  useEffect(() => {
    if (!isInputFocused) {
      setFilteredUsers([]);
      return;
    }

    if (!search) {
      // When search is empty, show first 10 users by default
      const memberIds = new Set(members.map(m => m.MemberID));
      const availableUsers = orgUsers.filter(u => !memberIds.has(u._id));
      setFilteredUsers(showAllUsers ? availableUsers : availableUsers.slice(0, 10));
      return;
    }

    const s = search.toLowerCase();
    // Exclude users who are already members
    const memberIds = new Set(members.map(m => m.MemberID));
    const matchingUsers = orgUsers.filter(u =>
      !memberIds.has(u._id) && (
        (u.firstName && u.firstName.toLowerCase().includes(s)) ||
        (u.lastName && u.lastName.toLowerCase().includes(s)) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.username && u.username.toLowerCase().includes(s)) ||
        (u._id && u._id.toLowerCase().includes(s))
      )
    );
    setFilteredUsers(showAllUsers ? matchingUsers : matchingUsers.slice(0, 10));
  }, [search, orgUsers, members, showAllUsers, isInputFocused]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!userToAdd) {
      setError('Please select a user to add');
      return;
    }
    setAdding(true);
    setError('');
    try {
      await api.post(`/team-details/${teamId}/add-member`, {
        UserID: userToAdd._id,
        OwnerID: team.OwnerID
      });
      setSearch('');
      setSelectedUser(null);
      setFilteredUsers([]);
      setShowAddMemberDialog(false);
      setUserToAdd(null);
      // Refresh members
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleStatus = async (memberId) => {
    setToggling(memberId);
    setError('');
    try {
      await api.patch(`/team-details/${teamId}/member/${memberId}/toggle`, { OwnerID: team.OwnerID });
      // Refresh members
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
      setShowRevokeDialog(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update status');
    } finally {
      setToggling('');
    }
  };

  const handleToggleTeamStatus = async () => {
    setTogglingTeam(true);
    setError('');
    try {
      await api.patch(`/team-details/${teamId}/toggle-status`, { OwnerID: team.OwnerID });
      // Refresh team data
      const res = await api.get(`/team-details/${teamId}`);
      setTeam(res.data.team);
      setShowConfirmDialog(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update team status');
    } finally {
      setTogglingTeam(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setRemoving(memberId);
    setError('');
    try {
      await api.delete(`/team-details/${teamId}/member/${memberId}`, {
        data: { OwnerID: team.OwnerID }
      });
      // Refresh members
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
      setShowRemoveDialog(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove member');
    } finally {
      setRemoving('');
    }
  };

  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpening(true);
    setShowSettingsModal(true);
    setTimeout(() => {
      setIsSettingsModalOpening(false);
    }, 300);
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalClosing(true);
    setTimeout(() => {
      setShowSettingsModal(false);
      setIsSettingsModalClosing(false);
    }, 300);
  };

  const handleOpenMeetingModal = () => {
    setIsMeetingModalOpening(true);
    setShowCreateMeetingModal(true);
    setTimeout(() => {
      setIsMeetingModalOpening(false);
    }, 300);
  };

  const handleCloseMeetingModal = () => {
    setIsMeetingModalClosing(true);
    setTimeout(() => {
      setShowCreateMeetingModal(false);
      setIsMeetingModalClosing(false);
    }, 300);
  };

  const handleMemberSelect = (memberId) => {
    setCreateMeetingForm(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(memberId)
        ? prev.attendeeIds.filter(id => id !== memberId)
        : [...prev.attendeeIds, memberId]
    }));
    setShowMemberDropdown(false);
  };

  const handleMemberRemove = (memberId) => {
    setCreateMeetingForm(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.filter(id => id !== memberId)
    }));
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setError('');
    try {
      const res = await api.patch(`/team-details/${teamId}`, {
        TeamName: settingsForm.TeamName,
        TeamDescription: settingsForm.TeamDescription,
        TeamType: settingsForm.TeamType,
        TeamColor: settingsForm.TeamColor,
        OwnerID: user?._id
      });

      // Refresh team data
      setTeam(res.data.team);
      handleCloseSettingsModal();
    } catch (err) {
      console.error('Error updating team:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteTeam = async () => {
    setDeletingTeam(true);
    setError('');
    console.table(teams);
    try {
      const res = await api.delete(`/team-details/${teamId}`, {
        data: { OwnerID: user?._id }
      });
      setTeams(teams.filter(t => t.TeamID !== teamId));
      router.push('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete team');
      setShowDeleteDialog(false);
    } finally {
      setDeletingTeam(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedMembers.length === 0) return;
    setBulkRemoving(true);
    setError('');
    try {
      await api.delete(`/team-details/${teamId}/members/remove-members`, {
        data: {
          memberIds: selectedMembers,
          OwnerID: user?._id
        }
      });
      // Refresh members
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
      setSelectedMembers([]);
      setShowBulkRemoveDialog(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove members');
    } finally {
      setBulkRemoving(false);
    }
  };

  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      // Don't include the team owner in selection
      const selectableMembers = members
        .filter(m => m.MemberID !== team.OwnerID)
        .map(m => m.MemberID);
      setSelectedMembers(selectableMembers);
    }
  };

  const handleBulkRemoveProjects = async () => {
    if (selectedProjects.length === 0) return;
    setBulkRemovingProjects(true);
    setError('');
    try {
      await api.delete(`/team-details/${teamId}/projects/remove-projects`, {
        data: {
          projectIds: selectedProjects,
          OwnerID: user?._id
        }

      });
      // Refresh projects
      const res = await api.get(`/team-details/${teamId}`);
      setActiveProjects(res.data.activeProjects);
      setSelectedProjects([]);
      setShowBulkRemoveProjectsDialog(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove projects');
    } finally {
      setBulkRemovingProjects(false);
    }
  };
  const openCreateMeeting = async () => {
    // If Google Calendar is not connected, prompt to connect via server-side OAuth
    if (!isGoogleCalendarConnected) {
      setShowGoogleCalendarPrompt(true);
      return;
    }

    // Reset editing state and form defaults when creating new
    setIsEditingMeeting(false);
    setEditingMeetingId(null);
    setCreateMeetingForm({ title: '', description: '', attendeeIds: [], taskIds: [], startTime: '', endTime: '' });
    handleOpenMeetingModal();
  };

  const toggleAttendee = (userId) => {
    setCreateMeetingForm(prev => {
      const exists = prev.attendeeIds.includes(userId);
      return { ...prev, attendeeIds: exists ? prev.attendeeIds.filter(id => id !== userId) : [...prev.attendeeIds, userId] };
    });
  };

  const toggleTask = (taskId) => {
    setCreateMeetingForm(prev => {
      const exists = prev.taskIds.includes(taskId);
      return { ...prev, taskIds: exists ? prev.taskIds.filter(id => id !== taskId) : [...prev.taskIds, taskId] };
    });
  };

  const handleTaskSearch = (query) => {
    setTaskSearchQuery(query);
    if (query.trim() === '') {
      setFilteredTasks(teamTasks);
    } else {
      const filtered = teamTasks.filter(task =>
        task.TaskName?.toLowerCase().includes(query.toLowerCase()) ||
        task.Title?.toLowerCase().includes(query.toLowerCase()) ||
        task.ProjectName?.toLowerCase().includes(query.toLowerCase()) ||
        task.TaskType?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTasks(filtered);
    }
  };

  const handleTaskSearchFocus = () => {
    setShowTaskDropdown(true);
    setFilteredTasks(teamTasks);
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest('.task-search-container')) {
      setShowTaskDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleCreateMeeting = async (e) => {
    e?.preventDefault?.();

    // Validation
    if (!createMeetingForm.title.trim()) {
      alert('Please enter a meeting title');
      return;
    }

    if (createMeetingForm.attendeeIds.length === 0) {
      alert('Please select at least one team member');
      return;
    }

    setCreatingMeeting(true);
    try {
      const payload = {
        title: createMeetingForm.title,
        description: createMeetingForm.description,
        attendeeIds: createMeetingForm.attendeeIds,
        taskIds: createMeetingForm.taskIds,
        startTime: createMeetingForm.startTime || null,
        endTime: createMeetingForm.endTime || null
      };

      let res;
      if (isEditingMeeting && editingMeetingId) {
        res = await meetingService.updateMeeting(editingMeetingId, payload);
        if (res.success) {
          setMeetings(prev => prev.map(m => m.MeetingID === editingMeetingId ? { ...m, ...res.meeting } : m));
          showToast('Meeting updated successfully', 'success');
        }
      } else {
        // Use server-stored Google credentials; no client token is sent
        res = await meetingService.createMeeting(teamId, payload);
        if (res.success) {
          setMeetings(prev => [res.meeting, ...prev]);
          showToast('Meeting created successfully', 'success');
        }
      }
      if (res?.success) {
        handleCloseMeetingModal();
        setCreateMeetingForm({ title: '', description: '', attendeeIds: [], taskIds: [], startTime: '', endTime: '' });
        setIsEditingMeeting(false);
        setEditingMeetingId(null);
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      showToast('Failed to save meeting. Please try again.', 'error');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const openMeetingDetails = async (meetingId) => {
    try {
      const res = await meetingService.getMeeting(meetingId);
      if (res.success) {
        console.log(res);
        setMeetingDetails(res);
        setShowMeetingDetailsModal(true);
        setIsEditingMeeting(false);
        setEditingMeetingId(meetingId);
      }
    } catch (_) { }
  };

  const handleDeleteMeeting = async (meetingId, e) => {
    e.stopPropagation(); // Prevent opening meeting details
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        const res = await meetingService.deleteMeeting(meetingId);
        if (res.success) {
          setMeetings(prev => prev.filter(m => m.MeetingID !== meetingId));
          showToast('Meeting deleted successfully', 'success');
        }
      } catch (error) {
        console.error('Error deleting meeting:', error);
        showToast('Failed to delete meeting', 'error');
      }
    }
  };

  const handleInitiateGoogleCalendarAuth = async () => {
    try {
      const res = await meetingService.initiateGoogleCalendarAuth();
      if (res.success && res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (error) {
      console.error('Error initiating Google Calendar auth:', error);
    }
  };

  // On mount or when user changes, check Google Calendar status once
  useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        if (!user?._id) return;
        const res = await meetingService.getGoogleCalendarStatus(user._id);
        if (res?.success) {
          setIsGoogleCalendarConnected(Boolean(res.connected));
          if (res.connected) setShowGoogleCalendarPrompt(false);
        }
      } catch (e) { /* ignore */ }
    };
    checkGoogleStatus();
  }, [user?._id]);

  const handleGoogleOAuthSuccess = async (credentialResponse) => {
    try {
      // Extract access token from credential response
      const accessToken = credentialResponse.credential;

      setGoogleAccessToken(accessToken);
      setIsGoogleCalendarConnected(true);
      setShowGoogleCalendarPrompt(false);
      // Persist connection on server for future use
      try {
        await meetingService.attachGoogleCalendarToken({ accessToken });
        // Update local storage user snapshot
        const userDataRaw = localStorage.getItem('user');
        if (userDataRaw) {
          const userData = JSON.parse(userDataRaw);
          userData.googleCalendarConnected = true;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error attaching Google Calendar token:', error);
      }

      // Now open the meeting creation modal
      handleOpenMeetingModal();
    } catch (error) {
      console.error('Error handling Google OAuth success:', error);
      alert('Failed to connect Google Calendar. Please try again.');
    }
  };

  const handleGoogleOAuthError = () => {
    console.error('Google OAuth failed');
    alert('Failed to connect Google Calendar. Please try again.');
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      }
      return [...prev, projectId];
    });
  };

  const handleSelectAllProjects = () => {
    if (selectedProjects.length === activeProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(activeProjects.map(p => p.ProjectID));
    }
  };



  const handleAcceptRequest = async (requestId, userId) => {
    setProcessingRequest(requestId + '-accept');
    try {
      await teamService.acceptTeamJoinRequest(teamId, requestId, user._id);
      // Refresh team data to get updated members and pending requests
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
      setJoinRequests(res.data.pendingRequests || []);
    } catch (err) {
      // Optionally show error
    } finally {
      setProcessingRequest('');
    }
  };
  const handleRejectRequest = async (requestId) => {
    setProcessingRequest(requestId + '-reject');
    try {
      await teamService.rejectTeamJoinRequest(teamId, requestId, user._id);
      // Refresh team data to get updated pending requests
      const res = await api.get(`/team-details/${teamId}`);
      setJoinRequests(res.data.pendingRequests || []);
    } catch (err) {
      // Optionally show error
    } finally {
      setProcessingRequest('');
    }
  };

  return (
    <>
      <Head>
        <title>{`Team - ${team?.TeamName || 'Loading...'} | TeamLabs`}</title>
        <meta name="theme-color" content={theme === 'dark' ? '#1F2937' : '#FFFFFF'} />
      </Head>
      <div className="mx-auto">

        {loading ? (
          <TeamDetailsSkeleton />
        ) : error ? (
          <div className={getThemeClasses(
            'text-center text-red-500',
            'dark:text-red-400'
          )}>{error}</div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

              {/* Team Description - Enhanced UI */}
              <div className={getThemeClasses(
                'flex w-full items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm',
                'dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700/50 dark:shadow-none'
              )}>
                <div className="flex items-center gap-3">
                  <div className={getThemeClasses(
                    'flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center',
                    'dark:bg-blue-900/50'
                  )}>
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className={getThemeClasses(
                      'text-sm font-semibold text-blue-800 mb-1',
                      'dark:text-blue-300'
                    )}>
                      Team Description
                    </h3>
                    {team.TeamDescription ? (
                      <p className={getThemeClasses(
                        'text-sm text-blue-700 leading-relaxed',
                        'dark:text-blue-200'
                      )}>
                        {team.TeamDescription}
                      </p>
                    ) : (
                      <p className={getThemeClasses(
                        'text-sm text-blue-600 italic',
                        'dark:text-blue-300'
                      )}>
                        No description provided
                      </p>
                    )}
                  </div>
                </div>
                {/* Right side controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusPill status={team.IsActive ? 'Active' : 'Offline'} theme={theme} showPulseOnActive />
                  {team.teamTypeValue && (
                    <div className={getThemeClasses(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-blue-50 text-blue-700 border border-blue-200',
                      'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50'
                    )}>
                      {team.teamTypeValue}
                    </div>
                  )}
                  {isOwner && (
                    <button
                      onClick={handleOpenSettingsModal}
                      className={getThemeClasses(
                        'p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100 transition-colors',
                        'dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700'
                      )}
                      title="Team Settings"
                    >
                      <FaCog size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isOwner && (
              <form onSubmit={handleAddMember} className="mb-4 flex flex-col gap-2">
                <label className={getThemeClasses(
                  'block text-gray-700 font-semibold mb-1',
                  'dark:text-gray-300'
                )}>Search for a Member (search by name, email, or UserID)</label>
                <input
                  type="text"
                  className={getThemeClasses(
                    'border rounded-xl px-4 py-2.5 w-full md:w-96 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
                    'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
                  )}
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setSelectedUser(null);
                    setShowAllUsers(false);
                  }}
                  onFocus={() => {
                    setIsInputFocused(true);
                    if (!search) {
                      const memberIds = new Set(members.map(m => m.MemberID));
                      const availableUsers = orgUsers.filter(u => !memberIds.has(u._id));
                      setFilteredUsers(availableUsers.slice(0, 10));
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsInputFocused(false);
                    }, 200);
                  }}
                  placeholder="Type to search..."
                  autoComplete="off"
                />
                {isInputFocused && filteredUsers.length > 0 && (
                  <div className="relative w-full md:w-96">
                    {/* Overlay backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsInputFocused(false)}
                    />
                    {/* Dropdown overlay */}
                    <div className="absolute top-full left-0 right-0 z-50 mt-1">
                      <ul className={getThemeClasses(
                        'border rounded-xl bg-white max-h-48 overflow-y-auto shadow-lg border-gray-200',
                        'dark:bg-gray-800 dark:border-gray-700'
                      )}>
                        {filteredUsers.map((user, index) => (
                          <li
                            key={`${user._id}-${index}`}
                            className={getThemeClasses(
                              'px-4 py-2.5 border-b last:border-b-0 transition-colors duration-150',
                              'dark:border-gray-700'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 p-2"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSearch(user.firstName + ' ' + user.lastName + ' (' + user.email + ')');
                                  setIsInputFocused(false);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Member Initials Avatar */}
                                  <div className={getThemeClasses(
                                    'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0',
                                    'dark:from-blue-600 dark:to-blue-700'
                                  )}>
                                    {user.firstName?.charAt(0)?.toUpperCase()}{user.lastName?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className={getThemeClasses(
                                      'font-medium text-gray-900',
                                      'dark:text-gray-100'
                                    )}>
                                      {user.firstName} {user.lastName}
                                    </div>
                                    <div className={getThemeClasses(
                                      'text-sm text-gray-600',
                                      'dark:text-gray-400'
                                    )}>
                                      {user.email}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToAdd(user);
                                  setShowAddMemberDialog(true);
                                }}
                                className={getThemeClasses(
                                  'ml-2 px-3 py-1.5 text-sm text-blue-500 font-medium rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-blue-100',
                                  'dark:text-blue-400 dark:hover:shadow-sm dark:hover:bg-blue-900/30'
                                )}
                              >
                                <FaPlus size={14} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {!showAllUsers && orgUsers.length > 10 && (
                        <button
                          type="button"
                          onClick={() => setShowAllUsers(true)}
                          className={getThemeClasses(
                            'w-full mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-xl transition-colors duration-200',
                            'dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30'
                          )}
                        >
                          Show All Users ({orgUsers.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* Join Requests Table (Owner/Admin only) */}
            {isOwner && (
              <div className={getThemeClasses('rounded-xl border border-gray-200', 'dark:border-gray-700')}>
                <div className={getThemeClasses('p-4 border-b border-gray-200', 'dark:border-gray-700')}>
                  <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>Join Requests</h2>
                </div>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-4">Loading requests...</div>
                  ) : joinRequests.length === 0 ? (
                    <div className="p-4 text-gray-500">No pending join requests.</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className={getThemeClasses('border-b border-gray-200', 'dark:border-gray-700')}>
                          <th className="py-3 px-4 text-left">User Details</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-left">Requested At</th>
                          <th className="py-3 px-4 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {joinRequests.map(req => (
                          <tr key={req._id} className={getThemeClasses('border-b border-gray-100', 'dark:border-gray-800')}>
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-3">
                                <div className={getThemeClasses(
                                  'w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium',
                                  'dark:bg-blue-900/50 dark:text-blue-300'
                                )}>
                                  {req.userId?.fullName
                                    ? req.userId.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                                    : req.userId?.firstName && req.userId?.lastName
                                      ? `${req.userId.firstName[0]}${req.userId.lastName[0]}`
                                      : req.userId?.firstName
                                        ? req.userId.firstName[0]
                                        : req.userId?.username
                                          ? req.userId.username[0].toUpperCase()
                                          : 'U'
                                  }
                                </div>
                                <div className="flex flex-col">
                                  <span className={getThemeClasses(
                                    'font-medium text-gray-900',
                                    'dark:text-gray-100'
                                  )}>
                                    {req.userId?.fullName || req.userId?.firstName && req.userId?.lastName
                                      ? `${req.userId.firstName} ${req.userId.lastName}`
                                      : req.userId?.firstName
                                        ? req.userId.firstName
                                        : req.userId?.username
                                          ? req.userId.username
                                          : 'Unknown User'
                                    }
                                  </span>
                                  <span className={getThemeClasses(
                                    'text-sm text-gray-500',
                                    'dark:text-gray-400'
                                  )}>
                                    {req.userId?.email || 'No email'}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {req.userId?.role && (
                                      <span className={getThemeClasses(
                                        'text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700',
                                        'dark:bg-blue-900/30 dark:text-blue-300'
                                      )}>
                                        {req.userId.role}
                                      </span>
                                    )}

                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              <StatusDropdown
                                currentStatus={req.userId?.status || 'Offline'}
                                onStatusChange={() => { }} // Read-only in this context
                                theme={theme}
                                isReadOnly={true}
                              />
                            </td>
                            <td className="py-2 px-4">{new Date(req.requestedAt).toLocaleString()}</td>
                            <td className="py-2 px-4">
                              <button
                                className="mr-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                                onClick={() => handleAcceptRequest(req._id, req.userId?._id)}
                                disabled={processingRequest === req._id + '-accept'}
                              >
                                Accept
                              </button>
                              <button
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                                onClick={() => handleRejectRequest(req._id)}
                                disabled={processingRequest === req._id + '-reject'}
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Meetings Section */}
            <div className={getThemeClasses('rounded-xl mb-6', 'dark:border-gray-700')}>
              <div className={getThemeClasses('px-4 pt-4 flex items-center justify-between', 'dark:border-gray-700')}>
                <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>Team Meetings</h2>
                <button
                  onClick={openCreateMeeting}
                  className={getThemeClasses('flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200', 'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800')}
                >
                  <FaPlus size={14} /> Meeting
                </button>
              </div>
              <div className="p-4">
                {loadingMeetings ? (
                  <div className={getThemeClasses('text-gray-500', 'dark:text-gray-400')}>Loading meetings...</div>
                ) : meetings.length === 0 ? (
                  <div className={getThemeClasses('text-gray-500', 'dark:text-gray-400')}>No meetings yet.</div>
                ) : (
                  <div className="flex items-center justify-unset gap-4">
                    {meetings.map(m => {
                      const meetingDays = calculateMeetingDays(m.StartTime || m.startTime);

                      return (
                        <div key={m.MeetingID} className={getThemeClasses('rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition', 'dark:border-gray-700')} onClick={() => openMeetingDetails(m.MeetingID)}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className={getThemeClasses('text-lg font-semibold text-gray-900 mb-1', 'dark:text-gray-100')}>{m.Title}</div>
                              <div className={getThemeClasses('text-sm text-gray-600 line-clamp-2', 'dark:text-gray-400')}>{m.Description || 'No description'}</div>
                            </div>
                            {/* Actions section similar to Team Members */}
                            {m.OrganizerID === user?._id && (
                              <div className="flex items-center justify-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => handleDeleteMeeting(m.MeetingID, e)}
                                  className={getThemeClasses(
                                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                    'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                                  )}
                                  title="Delete meeting"
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className={getThemeClasses('mt-2 flex items-center gap-3 rounded-lg border border-gray-200 p-3', 'dark:border-gray-700')}>
                            <FaClock className={getThemeClasses('text-gray-500', 'dark:text-gray-400')} />
                            <div className={getThemeClasses('text-sm text-gray-900', 'dark:text-gray-100')}>
                              {formatDateWithTime(m.StartTime || m.startTime)}
                            </div>
                            <FaArrowRight className={getThemeClasses('text-gray-400', 'dark:text-gray-500')} />
                            <div className={getThemeClasses('text-sm text-gray-900', 'dark:text-gray-100')}>
                              {formatDateWithTime(m.EndTime || m.endTime)}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            {m.GoogleMeetLink && (
                              <a href={m.GoogleMeetLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={getThemeClasses(
                                meetingDays.status === 'past' || meetingDays.status === 'yesterday'
                                  ? 'text-red-600 cursor-not-allowed'
                                  : 'text-blue-600 hover:underline',
                                'dark:text-red-400'
                              )}>
                                {meetingDays.status === 'past' || meetingDays.status === 'yesterday' ? 'Expired' : 'Join Meeting'}
                              </a>
                            )}
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border ${getDaysBadgeColor(meetingDays.status)}`}>
                              {meetingDays.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Team Members and Projects Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Members Table */}
              <div className={getThemeClasses(
                'rounded-xl border border-gray-200',
                'dark:border-gray-700'
              )}>
                <div className={getThemeClasses(
                  'p-4 border-b border-gray-200',
                  'dark:border-gray-700'
                )}>
                  <div className="flex items-center justify-between">
                    <h2 className={getThemeClasses(
                      'text-xl font-semibold text-gray-900',
                      'dark:text-gray-100'
                    )}>Team Members</h2>
                    {selectedMembers.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className={getThemeClasses(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700',
                          'dark:bg-blue-900/30 dark:text-blue-300'
                        )}>
                          <span className="text-sm font-medium">{selectedMembers.length} selected</span>
                          <button
                            onClick={() => setSelectedMembers([])}
                            className={getThemeClasses(
                              'p-1 hover:bg-blue-100 rounded-full transition-colors',
                              'dark:hover:bg-blue-900/50'
                            )}
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => setShowBulkRemoveDialog(true)}
                          className={getThemeClasses(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors',
                            'dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                          )}
                        >
                          <FaTrash size={14} />
                          Remove Selected
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={getThemeClasses(
                        'border-b border-gray-200',
                        'dark:border-gray-700'
                      )}>
                        {isOwner && (
                          <th className="py-3 px-4 text-center w-[50px]">
                            <input
                              type="checkbox"
                              checked={selectedMembers.length === members.filter(m => m.MemberID !== team.OwnerID).length}
                              onChange={handleSelectAll}
                              className={getThemeClasses(
                                'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                              )}
                            />
                          </th>
                        )}
                        <th className={getThemeClasses(
                          'py-3 px-4 text-left w-[300px] text-gray-700',
                          'dark:text-gray-300'
                        )}>Member</th>
                        <th className={getThemeClasses(
                          'hidden md:table-cell py-3 px-4 text-left w-[200px] text-gray-700',
                          'dark:text-gray-300'
                        )}>Date Added</th>
                        <th className={getThemeClasses(
                          'hidden md:table-cell py-3 px-4 text-center w-[150px] text-gray-700',
                          'dark:text-gray-300'
                        )}>Status</th>
                        {isOwner && <th className={getThemeClasses(
                          'py-3 px-4 text-center w-[150px] text-gray-700',
                          'dark:text-gray-300'
                        )}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(member => (
                        <tr key={member.TeamDetailsID} className={getThemeClasses(
                          'border-b border-gray-100 hover:bg-gray-50/50 transition-colors last:border-b-0',
                          'dark:border-gray-700 dark:hover:bg-gray-700/30'
                        )}>
                          {isOwner && (
                            <td className="py-3 px-4 text-center">
                              {member.MemberID !== team.OwnerID && (
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.includes(member.MemberID)}
                                  onChange={() => handleSelectMember(member.MemberID)}
                                  className={getThemeClasses(
                                    'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                    'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                                  )}
                                />
                              )}
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={getThemeClasses(
                                'w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium',
                                'dark:bg-blue-900/50 dark:text-blue-300'
                              )}>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex flex-col">
                                <span className={getThemeClasses(
                                  'font-medium text-gray-900',
                                  'dark:text-gray-100'
                                )}>{member.name}</span>
                                <span className={getThemeClasses(
                                  'text-sm text-gray-500',
                                  'dark:text-gray-400'
                                )}>{member.email}</span>
                                {/* Show status badge on mobile inline with name */}
                                <div className="md:hidden mt-1">
                                  <div className={getThemeClasses(
                                    `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${member.IsMemberActive
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                    }`,
                                    `dark:${member.IsMemberActive
                                      ? 'bg-green-900/30 text-green-300'
                                      : 'bg-red-900/30 text-red-300'
                                    }`
                                  )}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${member.IsMemberActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {member.IsMemberActive ? 'Active' : 'Inactive'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={getThemeClasses(
                            'hidden md:table-cell py-3 px-4 text-gray-600',
                            'dark:text-gray-400'
                          )}>
                            {new Date(member.CreatedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="hidden md:table-cell py-3 px-4 text-center">
                            <StatusPill status={member.IsMemberActive ? 'Active' : 'Offline'} theme={theme} showPulseOnActive />
                          </td>
                          {isOwner && (
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    if (!member.IsMemberActive) {
                                      setSelectedInactiveMember(member);
                                      setShowInactiveMemberDialog(true);
                                      return;
                                    }
                                    setSelectedMember(member);
                                    setShowRevokeDialog(true);
                                  }}
                                  className={getThemeClasses(
                                    `inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${member.IsMemberActive
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`,
                                    `dark:${member.IsMemberActive
                                      ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                                      : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'
                                    }`
                                  )}
                                  title={member.IsMemberActive ? 'Revoke Access' : 'Grant Access'}
                                  disabled={toggling === member.TeamDetailsID}
                                >
                                  <FaToggleOn size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (!member.IsMemberActive) {
                                      setSelectedInactiveMember(member);
                                      setShowInactiveMemberDialog(true);
                                      return;
                                    }
                                    setSelectedMember(member);
                                    setShowRemoveDialog(true);
                                  }}
                                  className={getThemeClasses(
                                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                    'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                                  )}
                                  title="Remove Member"
                                  disabled={removing === member.TeamDetailsID}
                                >
                                  <FaTimes size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {members.length === 0 && (
                        <tr>
                          <td colSpan={isOwner ? 5 : 4} className={getThemeClasses(
                            'text-center py-8 text-gray-400',
                            'dark:text-gray-500'
                          )}>
                            No members in this team
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Projects Table */}
              <div className={getThemeClasses(
                'rounded-xl border border-gray-200',
                'dark:border-gray-700'
              )}>
                <div className={getThemeClasses(
                  'p-4 border-b border-gray-200',
                  'dark:border-gray-700'
                )}>
                  <div className="flex items-center justify-between">
                    <h2 className={getThemeClasses(
                      'text-xl font-semibold text-gray-900',
                      'dark:text-gray-100'
                    )}>Projects Assigned</h2>
                    {selectedProjects.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className={getThemeClasses(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700',
                          'dark:bg-blue-900/30 dark:text-blue-300'
                        )}>
                          <span className="text-sm font-medium">{selectedProjects.length} selected</span>
                          <button
                            onClick={() => setSelectedProjects([])}
                            className={getThemeClasses(
                              'p-1 hover:bg-blue-100 rounded-full transition-colors',
                              'dark:hover:bg-blue-900/50'
                            )}
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => setShowBulkRemoveProjectsDialog(true)}
                          className={getThemeClasses(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors',
                            'dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                          )}
                        >
                          <FaTrash size={14} />
                          Remove Selected
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {activeProjects.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className={getThemeClasses(
                          'border-b border-gray-200',
                          'dark:border-gray-700'
                        )}>
                          {isOwner && (
                            <th className="py-3 px-4 text-center w-[50px]">
                              <input
                                type="checkbox"
                                checked={selectedProjects.length === activeProjects.length}
                                onChange={handleSelectAllProjects}
                                className={getThemeClasses(
                                  'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                  'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                                )}
                              />
                            </th>
                          )}
                          <th className={getThemeClasses(
                            'py-3 px-4 text-left text-gray-700',
                            'dark:text-gray-300'
                          )}>Project Name</th>
                          <th className={getThemeClasses(
                            'py-3 px-4 text-left text-gray-700',
                            'dark:text-gray-300'
                          )}>Date Assigned</th>
                          <th className={getThemeClasses(
                            'py-3 px-4 text-left text-gray-700',
                            'dark:text-gray-300'
                          )}>Deadline</th>
                          <th className={getThemeClasses(
                            'py-3 px-4 text-center text-gray-700',
                            'dark:text-gray-300'
                          )}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeProjects.map(proj => {
                          const projectStatus = getProjectStatus(proj.ProjectStatusID);
                          const statusStyle = getProjectStatusStyle(projectStatus.Code);

                          return (
                            <tr key={proj.ProjectID} className={getThemeClasses(
                              'border-b border-gray-100 hover:bg-gray-50/50 transition-colors last:border-b-0',
                              'dark:border-gray-700 dark:hover:bg-gray-700/30'
                            )}>
                              {isOwner && (
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedProjects.includes(proj.ProjectID)}
                                    onChange={() => handleSelectProject(proj.ProjectID)}
                                    className={getThemeClasses(
                                      'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                      'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                                    )}
                                  />
                                </td>
                              )}
                              <td className={getThemeClasses(
                                'py-3 px-4 font-medium text-gray-900',
                                'dark:text-gray-100'
                              )}>
                                <Link href={`/project/${proj.ProjectID}`} legacyBehavior>
                                  <a className="hover:text-blue-600 hover:underline transition-colors cursor-pointer" title="View Project Details">
                                    {proj.Name}
                                  </a>
                                </Link>
                              </td>
                              <td className={getThemeClasses(
                                'py-3 px-4 text-gray-600',
                                'dark:text-gray-400'
                              )}>
                                {proj.AssignedDate ? new Date(proj.AssignedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                              </td>
                              <td className={getThemeClasses(
                                'py-3 px-4 text-gray-600',
                                'dark:text-gray-400'
                              )}>
                                {proj.FinishDate ? new Date(proj.FinishDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getProjectStatusBadgeComponent(proj.ProjectStatusID)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className={getThemeClasses(
                      'text-center py-8 text-gray-400',
                      'dark:text-gray-500'
                    )}>
                      No Projects Assigned
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Member Access Confirmation Dialog */}
            {showRevokeDialog && selectedMember && (
              <CustomModal
                isOpen={showRevokeDialog}
                onClose={() => {
                  setShowRevokeDialog(false);
                  setSelectedMember(null);
                }}
                title={selectedMember.IsMemberActive ? 'Revoke Access' : 'Grant Access'}
                getThemeClasses={getThemeClasses}
                actions={
                  <>
                    <button
                      onClick={() => {
                        setShowRevokeDialog(false);
                        setSelectedMember(null);
                      }}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleToggleStatus(selectedMember.MemberID)}
                      className={getThemeClasses(
                        `px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 ${selectedMember.IsMemberActive ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'}`,
                        `dark:${selectedMember.IsMemberActive ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'}`
                      )}
                      disabled={toggling === selectedMember.MemberID}
                    >
                      {toggling === selectedMember.MemberID ? 'Updating...' : 'Confirm'}
                    </button>
                  </>
                }
              >
                <p className={getThemeClasses(
                  'text-gray-600',
                  'dark:text-gray-400'
                )}>
                  {selectedMember.IsMemberActive
                    ? `Are you sure you want to revoke access for ${selectedMember.name}? This will prevent them from accessing team resources.`
                    : `Are you sure you want to grant access for ${selectedMember.name}? This will allow them to access team resources.`}
                </p>
              </CustomModal>
            )}

            {/* Remove Member Confirmation Dialog */}
            {showRemoveDialog && selectedMember && (
              <CustomModal
                isOpen={showRemoveDialog}
                onClose={() => {
                  setShowRemoveDialog(false);
                  setSelectedMember(null);
                }}
                title="Remove Member"
                getThemeClasses={getThemeClasses}
                actions={
                  <>
                    <button
                      onClick={() => {
                        setShowRemoveDialog(false);
                        setSelectedMember(null);
                      }}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRemoveMember(selectedMember.MemberID)}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
                        'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                      )}
                      disabled={removing === selectedMember.MemberID}
                    >
                      {removing === selectedMember.MemberID ? 'Removing...' : 'Remove'}
                    </button>
                  </>
                }
              >
                <p className={getThemeClasses(
                  'text-gray-600',
                  'dark:text-gray-400'
                )}>
                  Are you sure you want to remove {selectedMember.name} from the team? This action cannot be undone.
                </p>
              </CustomModal>
            )}

            {/* Team Settings Modal */}
            {showSettingsModal && (
              <div className="fixed inset-0 z-40">
                <div
                  className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isSettingsModalClosing ? 'opacity-0' : 'opacity-100'}`}
                  onClick={handleCloseSettingsModal}
                />
                <div className={`absolute right-0 top-16 bottom-0 w-full lg:max-w-lg ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isSettingsModalClosing ? 'translate-x-full' : isSettingsModalOpening ? 'translate-x-full' : 'translate-x-0'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={getThemeClasses(
                      'text-xl font-semibold text-gray-900',
                      'text-xl font-semibold text-white'
                    )}>Team Settings</h3>
                    <button
                      onClick={handleCloseSettingsModal}
                      className={getThemeClasses(
                        'text-gray-400 hover:text-gray-600 text-2xl font-bold',
                        'text-gray-400 hover:text-gray-300 text-2xl font-bold'
                      )}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleSettingsSave} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <FaUsers className={getThemeClasses(
                          'text-gray-500',
                          'text-gray-400'
                        )} size={16} />
                        <label className={getThemeClasses(
                          'text-sm font-medium text-gray-700',
                          'text-sm font-medium text-gray-300'
                        )}>
                          Team Name<span className="text-red-500 ml-1">*</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={settingsForm.TeamName}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, TeamName: e.target.value }))}
                        className={getThemeClasses(
                          'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                          'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
                        )}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <FaAlignLeft className={getThemeClasses(
                          'text-gray-500',
                          'text-gray-400'
                        )} size={16} />
                        <label className={getThemeClasses(
                          'text-sm font-medium text-gray-700',
                          'text-sm font-medium text-gray-300'
                        )}>
                          Description
                        </label>
                      </div>
                      <textarea
                        value={settingsForm.TeamDescription}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, TeamDescription: e.target.value }))}
                        className={getThemeClasses(
                          'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 resize-none',
                          'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white resize-none'
                        )}
                        rows="3"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <FaTag className={getThemeClasses(
                          'text-gray-500',
                          'text-gray-400'
                        )} size={16} />
                        <label className={getThemeClasses(
                          'text-sm font-medium text-gray-700',
                          'text-sm font-medium text-gray-300'
                        )}>
                          Team Type
                        </label>
                      </div>
                      <div className="flex-1 flex items-center gap-4">
                        <select
                          value={settingsForm.TeamType}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, TeamType: e.target.value }))}
                          className={getThemeClasses(
                            'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                            'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
                          )}
                        >
                          <option value="">Select Team Type</option>
                          {teamTypes.map((type) => (
                            <option key={type.Code} value={type.Code}>
                              {type.Value}
                            </option>
                          ))}
                        </select>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => setShowConfirmDialog(true)}
                            className={getThemeClasses(
                              `inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all duration-200 ${team.IsActive ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200' : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 hover:from-green-100 hover:to-green-200'} ${togglingTeam ? 'opacity-50 cursor-not-allowed' : ''}`,
                              `dark:${team.IsActive ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'} ${togglingTeam ? 'opacity-50 cursor-not-allowed' : ''}`
                            )}
                            disabled={togglingTeam}
                          >
                            <span className={`w-2 h-2 rounded-full ${team.IsActive ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            {togglingTeam ? 'Updating...' : team.IsActive ? 'Deactivate Team' : 'Activate Team'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-6">
                      <div className="flex gap-3">
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => setShowDeleteDialog(true)}
                            className={getThemeClasses(
                              'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200 transition-all duration-200',
                              'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                            )}
                          >
                            <FaTrash className="w-4 h-4" />
                            Delete Team
                          </button>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleCloseSettingsModal}
                          className={getThemeClasses(
                            'px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                            'dark:text-gray-400 dark:hover:bg-gray-700'
                          )}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={getThemeClasses(
                            'px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200',
                            'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
                          )}
                          disabled={savingSettings}
                        >
                          {savingSettings ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Team Status Confirmation Dialog */}
            {showConfirmDialog && (
              <CustomModal
                isOpen={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                title={team.IsActive ? 'Deactivate Team' : 'Activate Team'}
                getThemeClasses={getThemeClasses}
                actions={
                  <>
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleToggleTeamStatus}
                      className={getThemeClasses(
                        `px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 ${team.IsActive ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'}`,
                        `dark:${team.IsActive ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'}`
                      )}
                      disabled={togglingTeam}
                    >
                      {togglingTeam ? 'Updating...' : 'Confirm'}
                    </button>
                  </>
                }
              >
                <p className={getThemeClasses(
                  'text-gray-600',
                  'dark:text-gray-400'
                )}>
                  {team.IsActive
                    ? 'Are you sure you want to deactivate this team? This will prevent members from accessing team resources.'
                    : 'Are you sure you want to activate this team? This will allow members to access team resources.'}
                </p>
              </CustomModal>
            )}

            {/* Add Member Confirmation Dialog */}
            {showAddMemberDialog && userToAdd && (
              <CustomModal
                isOpen={showAddMemberDialog}
                onClose={() => {
                  setShowAddMemberDialog(false);
                  setUserToAdd(null);
                }}
                title="Add Team Member"
                getThemeClasses={getThemeClasses}
                actions={
                  <>
                    <button
                      onClick={() => {
                        setShowAddMemberDialog(false);
                        setUserToAdd(null);
                      }}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMember}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
                        'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
                      )}
                      disabled={adding}
                    >
                      {adding ? 'Adding...' : 'Confirm'}
                    </button>
                  </>
                }
              >
                <p className={getThemeClasses(
                  'text-gray-600',
                  'dark:text-gray-400'
                )}>
                  Are you sure you want to add {userToAdd.firstName} {userToAdd.lastName} to the team?
                </p>
              </CustomModal>
            )}

            {/* Inactive Member Dialog */}
            {showInactiveMemberDialog && selectedInactiveMember && (
              <CustomModal
                isOpen={showInactiveMemberDialog}
                onClose={() => {
                  setShowInactiveMemberDialog(false);
                  setSelectedInactiveMember(null);
                }}
                title="Inactive Member"
                getThemeClasses={getThemeClasses}
                actions={
                  <>
                    <button
                      onClick={() => {
                        setShowInactiveMemberDialog(false);
                        setSelectedInactiveMember(null);
                      }}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowInactiveMemberDialog(false);
                        setSelectedInactiveMember(null);
                        setSelectedMember(selectedInactiveMember);
                        setShowRevokeDialog(true);
                      }}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
                        'dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70'
                      )}
                    >
                      Activate Member
                    </button>
                  </>
                }
              >
                <p className={getThemeClasses(
                  'text-gray-600',
                  'dark:text-gray-400'
                )}>
                  {selectedInactiveMember.name} is currently inactive in the team. You must activate the member before performing any actions.
                </p>
              </CustomModal>
            )}

            {/* Delete Team Confirmation Dialog */}
            {showDeleteDialog && (
              <CustomModal
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                title="Delete Team"
                getThemeClasses={getThemeClasses}
                actions={
                  <>
                    <button
                      onClick={() => setShowDeleteDialog(false)}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteTeam}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
                        'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                      )}
                      disabled={deletingTeam}
                    >
                      {deletingTeam ? 'Deleting...' : 'Delete Team'}
                    </button>
                  </>
                }
              >
                <p className={getThemeClasses(
                  'text-gray-600',
                  'dark:text-gray-400'
                )}>
                  Are you sure you want to delete this team? This action cannot be undone and will remove all team members and associated data.
                </p>
              </CustomModal>
            )}
            {/* Create Meeting Modal */}
            {showCreateMeetingModal && (
              <div className="fixed inset-0 z-40">
                <div
                  className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isMeetingModalClosing ? 'opacity-0' : 'opacity-100'}`}
                  onClick={handleCloseMeetingModal}
                />
                <div className={`absolute right-0 top-16 bottom-0 w-full lg:max-w-3xl ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isMeetingModalClosing ? 'translate-x-full' : isMeetingModalOpening ? 'translate-x-full' : 'translate-x-0'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={getThemeClasses(
                      'text-xl font-semibold text-gray-900',
                      'text-xl font-semibold text-white'
                    )}>{isEditingMeeting ? 'Edit Meeting' : 'Create Meeting'}</h3>
                    <button
                      onClick={handleCloseMeetingModal}
                      className={getThemeClasses(
                        'text-gray-400 hover:text-gray-600 text-2xl font-bold',
                        'text-gray-400 hover:text-gray-300 text-2xl font-bold'
                      )}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleCreateMeeting} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <FaCalendarAlt className={getThemeClasses(
                          'text-gray-500',
                          'text-gray-400'
                        )} size={16} />
                        <label className={getThemeClasses(
                          'text-sm font-medium text-gray-700',
                          'text-sm font-medium text-gray-300'
                        )}>
                          Title<span className="text-red-500 ml-1">*</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={createMeetingForm.title}
                        onChange={(e) => setCreateMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                        className={getThemeClasses(
                          'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                          'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
                        )}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <FaAlignLeft className={getThemeClasses(
                          'text-gray-500',
                          'text-gray-400'
                        )} size={16} />
                        <label className={getThemeClasses(
                          'text-sm font-medium text-gray-700',
                          'text-sm font-medium text-gray-300'
                        )}>
                          Description
                        </label>
                      </div>
                      <textarea
                        value={createMeetingForm.description}
                        onChange={(e) => setCreateMeetingForm(prev => ({ ...prev, description: e.target.value }))}
                        className={getThemeClasses(
                          'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 resize-none',
                          'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white resize-none'
                        )}
                        rows="3"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <FaClock className={getThemeClasses(
                            'text-gray-500',
                            'text-gray-400'
                          )} size={16} />
                          <label className={getThemeClasses(
                            'text-sm font-medium text-gray-700',
                            'text-sm font-medium text-gray-300'
                          )}>
                            Start Time<span className="text-red-500 ml-1">*</span>
                          </label>
                        </div>
                        <input
                          type="datetime-local"
                          value={createMeetingForm.startTime}
                          onChange={(e) => setCreateMeetingForm(prev => ({ ...prev, startTime: e.target.value }))}
                          className={getThemeClasses(
                            'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                            'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <FaClock className={getThemeClasses(
                            'text-gray-500',
                            'text-gray-400'
                          )} size={16} />
                          <label className={getThemeClasses(
                            'text-sm font-medium text-gray-700',
                            'text-sm font-medium text-gray-300'
                          )}>
                            End Time<span className="text-red-500 ml-1">*</span>
                          </label>
                        </div>
                        <input
                          type="datetime-local"
                          value={createMeetingForm.endTime}
                          onChange={(e) => setCreateMeetingForm(prev => ({ ...prev, endTime: e.target.value }))}
                          className={getThemeClasses(
                            'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                            'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <FaUserFriends className={getThemeClasses(
                          'text-gray-500',
                          'text-gray-400'
                        )} size={16} />
                        <label className={getThemeClasses(
                          'text-sm font-medium text-gray-700',
                          'text-sm font-medium text-gray-300'
                        )}>
                          Team Members<span className="text-red-500 ml-1">*</span>
                        </label>
                      </div>
                      
                      {/* Selected Members Display */}
                      {createMeetingForm.attendeeIds.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {createMeetingForm.attendeeIds.map(memberId => {
                              const member = members.find(m => m.MemberID === memberId);
                              return member ? (
                                <div
                                  key={memberId}
                                  className={getThemeClasses(
                                    'flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm',
                                    'flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 border border-blue-700 rounded-lg text-sm'
                                  )}
                                >
                                  <span className={getThemeClasses(
                                    'text-blue-700',
                                    'text-blue-300'
                                  )}>
                                    {member.email}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleMemberRemove(memberId)}
                                    className={getThemeClasses(
                                      'text-blue-500 hover:text-red-500 transition-colors',
                                      'text-blue-400 hover:text-red-400 transition-colors'
                                    )}
                                  >
                                    <FaTimes size={12} />
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Member Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                          className={getThemeClasses(
                            'w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 flex items-center justify-between',
                            'w-full px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white flex items-center justify-between'
                          )}
                        >
                          <span className={getThemeClasses(
                            'text-gray-500',
                            'text-gray-400'
                          )}>
                            {createMeetingForm.attendeeIds.length > 0 
                              ? `${createMeetingForm.attendeeIds.length} member(s) selected`
                              : 'Select team members'
                            }
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {showMemberDropdown && (
                          <>
                            <div className={getThemeClasses(
                              'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-auto max-h-64',
                              'absolute z-50 w-full mt-1 bg-[#18181b] border border-gray-600 rounded-xl shadow-lg overflow-auto max-h-64'
                            )}>
                              {members.map((member) => (
                                <button
                                  key={member.MemberID}
                                  type="button"
                                  onClick={() => handleMemberSelect(member.MemberID)}
                                  className={getThemeClasses(
                                    'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-3',
                                    'w-full px-4 py-3 text-left hover:bg-[#424242] transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-3'
                                  )}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                    createMeetingForm.attendeeIds.includes(member.MemberID)
                                      ? 'bg-blue-500 text-white'
                                      : getThemeClasses('bg-gray-100 text-gray-700', 'bg-gray-700 text-gray-300')
                                  }`}>
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={getThemeClasses(
                                      'font-medium text-gray-900 text-sm truncate',
                                      'font-medium text-white text-sm truncate'
                                    )}>
                                      {member.name}
                                    </div>
                                    <div className={getThemeClasses(
                                      'text-xs text-gray-500 truncate',
                                      'text-xs text-gray-400 truncate'
                                    )}>
                                      {member.email}
                                    </div>
                                  </div>
                                  {createMeetingForm.attendeeIds.includes(member.MemberID) && (
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                            {/* Click outside to close */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowMemberDropdown(false)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className={getThemeClasses('block text-sm font-medium text-gray-700 mb-2', 'dark:text-gray-300')}>Attach Tasks</label>
                      <div className="relative task-search-container">
                        <input
                          type="text"
                          placeholder="Search tasks by name, project, or type..."
                          value={taskSearchQuery}
                          onChange={(e) => handleTaskSearch(e.target.value)}
                          onFocus={handleTaskSearchFocus}
                          className={getThemeClasses('w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200', 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400')}
                        />
                        {showTaskDropdown && (
                          <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                            {filteredTasks.length > 0 ? (
                              <div className="p-2 space-y-1">
                                {filteredTasks.map(t => (
                                  <div key={t.TaskID} onClick={() => {
                                    toggleTask(t.TaskID);
                                    setShowTaskDropdown(false);
                                    setTaskSearchQuery('');
                                  }}
                                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${createMeetingForm.taskIds.includes(t.TaskID)
                                      ? 'bg-blue-50 border border-blue-200'
                                      : 'hover:bg-gray-50'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${createMeetingForm.taskIds.includes(t.TaskID)
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
                                        }`}>
                                        {createMeetingForm.taskIds.includes(t.TaskID) && (
                                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                          {t.TaskName}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          <span className="inline-block mr-2">
                                            {getTaskTypeBadge(t.TaskType)}
                                          </span>
                                          <span className="inline-block mr-2">
                                            {getPriorityBadge(t.Priority)}
                                          </span>
                                          <span className="text-gray-400">Project: {t.ProjectName}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                No tasks found matching your search.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {createMeetingForm.taskIds.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                Selected Tasks ({createMeetingForm.taskIds.length})
                              </span>
                            </div>
                            <button
                              onClick={() => setCreateMeetingForm(prev => ({ ...prev, taskIds: [] }))}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                            {teamTasks.filter(t => createMeetingForm.taskIds.includes(t.TaskID)).map(t => (
                              <div key={t.TaskID} className="flex flex-col p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="font-medium text-gray-900 text-sm leading-tight">
                                      {t.TaskName}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => toggleTask(t.TaskID)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 flex-shrink-0"
                                    title="Remove task"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  <span className="text-gray-500">Project:</span>
                                  <span className="font-medium ml-1">{t.ProjectName}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-auto">
                                  {getTaskTypeBadge(t.TaskType)}
                                  {getPriorityBadge(t.Priority)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleCloseMeetingModal}
                        className={getThemeClasses('px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200', 'dark:text-gray-400 dark:hover:bg-gray-700')}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={getThemeClasses('px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200', 'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800')}
                        disabled={creatingMeeting}
                      >
                        {creatingMeeting ? (isEditingMeeting ? 'Updating...' : 'Creating...') : (isEditingMeeting ? 'Update' : 'Create Meeting')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Meeting Details Modal */}
            {showMeetingDetailsModal && meetingDetails && (() => {
              const modalMeetingDays = calculateMeetingDays(meetingDetails.meeting?.StartTime || meetingDetails.meeting?.startTime);
              const isExpired = modalMeetingDays.status === 'past' || modalMeetingDays.status === 'yesterday';

              return (
                <CustomModal
                  isOpen={showMeetingDetailsModal}
                  onClose={() => setShowMeetingDetailsModal(false)}
                  title={meetingDetails.meeting?.Title || 'Meeting Details'}
                  getThemeClasses={getThemeClasses}
                  actions={
                    <>
                      {meetingDetails.meeting?.OrganizerID === user?._id && (
                        <button
                          onClick={() => {
                            // Prefill createMeetingForm with details
                            setCreateMeetingForm({
                              title: meetingDetails.meeting?.Title || '',
                              description: meetingDetails.meeting?.Description || '',
                              attendeeIds: Array.isArray(meetingDetails.meeting?.AttendeeIDs) ? meetingDetails.meeting.AttendeeIDs : (meetingDetails.attendees || []).map(a => a._id).filter(Boolean),
                              taskIds: Array.isArray(meetingDetails.meeting?.TaskIDs) ? meetingDetails.meeting.TaskIDs : (meetingDetails.tasks || []).map(t => t.TaskID).filter(Boolean),
                              startTime: formatForDatetimeLocal(meetingDetails.meeting?.StartTime || meetingDetails.meeting?.startTime),
                              endTime: formatForDatetimeLocal(meetingDetails.meeting?.EndTime || meetingDetails.meeting?.endTime)
                            });
                            setIsEditingMeeting(true);
                            setShowMeetingDetailsModal(false);
                            handleOpenMeetingModal();
                          }}
                          className={getThemeClasses('px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200', 'dark:text-gray-300 dark:hover:bg-gray-700')}
                        >
                          Edit
                        </button>
                      )}
                      {meetingDetails.meeting?.GoogleMeetLink && (
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(meetingDetails.meeting.GoogleMeetLink);
                            showToast('Link copied to clipboard', 'success');
                          }}
                          className={getThemeClasses('px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200', 'dark:text-gray-300 dark:hover:bg-gray-700')}
                        >
                          Copy Link
                        </button>
                      )}
                      {meetingDetails.meeting?.GoogleMeetLink && (
                        <button
                          onClick={() => {
                            if (!isExpired) {
                              window.open(meetingDetails.meeting.GoogleMeetLink, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className={getThemeClasses(
                            isExpired
                              ? 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium cursor-not-allowed'
                              : 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200',
                            'dark:from-red-600 dark:to-red-700'
                          )}
                          disabled={isExpired}
                        >
                          {isExpired ? 'Expired' : 'Join Meeting'}
                        </button>
                      )}
                    </>
                  }
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className={getThemeClasses('text-sm text-gray-700', 'dark:text-gray-300')}>
                        {meetingDetails.meeting?.Description || 'No description'}
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border ${getDaysBadgeColor(modalMeetingDays.status)}`}>
                        {modalMeetingDays.text}
                      </div>
                    </div>

                    <div className={getThemeClasses('flex items-center gap-3 rounded-lg border border-gray-200 p-3', 'dark:border-gray-700')}>
                      <FaClock className={getThemeClasses('text-gray-500', 'dark:text-gray-400')} />
                      <div className={getThemeClasses('text-sm text-gray-900', 'dark:text-gray-100')}>
                        {formatDateWithTime(meetingDetails.meeting?.StartTime || meetingDetails.meeting?.startTime)}
                      </div>
                      <FaArrowRight className={getThemeClasses('text-gray-400', 'dark:text-gray-500')} />
                      <div className={getThemeClasses('text-sm text-gray-900', 'dark:text-gray-100')}>
                        {formatDateWithTime(meetingDetails.meeting?.EndTime || meetingDetails.meeting?.endTime)}
                      </div>
                    </div>

                    <div>
                      <div className={getThemeClasses('font-semibold text-gray-900 mb-2', 'dark:text-gray-100')}>Attendees</div>
                      <ul className="list-disc pl-5">
                        {(meetingDetails.attendees || []).map(a => (
                          <li key={a._id} className={getThemeClasses('text-sm text-gray-700', 'dark:text-gray-300')}>
                            {a.firstName} {a.lastName} ({a.email})
                          </li>
                        ))}
                        {(!meetingDetails.attendees || meetingDetails.attendees.length === 0) && (
                          <li className={getThemeClasses('text-sm text-gray-500', 'dark:text-gray-400')}>No attendees</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <div className={getThemeClasses('font-semibold text-gray-900 mb-2', 'dark:text-gray-100')}>Discussion For</div>
                      <ul className="list-disc pl-5">
                        {(meetingDetails.tasks || []).map(t => (
                          <li key={t.TaskID} className={getThemeClasses('text-sm text-gray-700', 'dark:text-gray-300')}>
                            <Link href={{ pathname: '/task/[taskId]', query: { taskId: t.TaskID } }} target="_blank" rel="noreferrer" className={getThemeClasses('inline-flex items-center gap-2 hover:underline hover:text-blue-600', 'dark:hover:text-gray-200')}>
                              <span>{t.Name}</span>
                              <FaExternalLinkAlt className="w-3.5 h-3.5 opacity-70 text-blue-600" />
                            </Link>
                          </li>
                        ))}
                        {(!meetingDetails.tasks || meetingDetails.tasks.length === 0) && (
                          <li className={getThemeClasses('text-sm text-gray-500', 'dark:text-gray-400')}>No tasks attached</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CustomModal>
              );
            })()}

            {/* Google Calendar Connection Prompt Modal */}
            {showGoogleCalendarPrompt && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={getThemeClasses('bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100', 'bg-[#18181b] border-[#232323]')}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={getThemeClasses('text-lg font-semibold text-gray-900', 'dark:text-gray-100')}>Connect Google Calendar</h3>
                    <button
                      onClick={() => setShowGoogleCalendarPrompt(false)}
                      className={getThemeClasses('text-gray-400 hover:text-gray-600 text-xl font-bold', 'dark:text-gray-500 dark:hover:text-gray-300')}
                    >
                      ×
                    </button>
                  </div>
                  <div className="mb-6">
                    <p className={getThemeClasses('text-sm text-gray-600 mb-4', 'dark:text-gray-400')}>
                      To create meetings with Google Meet links, you need to connect your Google Calendar account.
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-sm text-blue-800">
                        <div className="font-medium">Google Meet Integration</div>
                        <div className="text-blue-600">Create meetings with automatic Google Meet links</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setShowGoogleCalendarPrompt(false)}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInitiateGoogleCalendarAuth}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200',
                        'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
                      )}
                    >
                      Connect Google Calendar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Remove Projects Confirmation Dialog */}
            {showBulkRemoveProjectsDialog && (
              <CustomModal
                isOpen={showBulkRemoveProjectsDialog}
                onClose={() => setShowBulkRemoveProjectsDialog(false)}
                title="Remove Selected Projects"
                getThemeClasses={getThemeClasses}
                actions={
                  <>
                    <button
                      onClick={() => setShowBulkRemoveProjectsDialog(false)}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkRemoveProjects}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
                        'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                      )}
                      disabled={bulkRemovingProjects}
                    >
                      {bulkRemovingProjects ? 'Removing...' : 'Remove Projects'}
                    </button>
                  </>
                }
              >
                <p className={getThemeClasses(
                  'text-gray-600',
                  'dark:text-gray-400'
                )}>
                  Are you sure you want to remove {selectedProjects.length} selected project{selectedProjects.length !== 1 ? 's' : ''} from the team? This action cannot be undone.
                </p>
              </CustomModal>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default TeamDetailsPage; 