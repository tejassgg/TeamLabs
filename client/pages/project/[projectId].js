import React, { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import StatusPill from '../../components/shared/StatusPill';
import api, { authService, taskService, githubService, commonTypeService } from '../../services/api';
import { FaEdit, FaTimes, FaSpinner, FaCode, FaInfoCircle, FaProjectDiagram, FaPlus, FaGithub, FaLink, FaUnlink, FaStar, FaCodeBranch, FaFile, FaAlignLeft, FaCalendarAlt, FaTag, FaFileAlt, FaRobot, FaSort, FaSortUp, FaSortDown, FaList, FaPaperPlane, FaTrash, FaCog, FaClock, FaShare, FaFlag, FaSignal } from 'react-icons/fa';
import { FiShare2, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiX, FiClock } from "react-icons/fi";
import { MdDelete } from 'react-icons/md';
import CustomModal from '../../components/shared/CustomModal';
import CustomDropdown from '../../components/shared/CustomDropdown';
import { useToast } from '../../context/ToastContext';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import KanbanBoard from '../kanban';
import { getProjectStatusBadge, getProjectStatusStyle } from '../../components/project/ProjectStatusBadge';
import { getPriorityBadge, getTaskStatusBadge, getTaskStatusStyle } from '../../components/task/TaskTypeBadge';
import ProjectPriorityBadge from '../../components/shared/ProjectPriorityBadge';
import ProjectDetailsSkeleton from '../../components/skeletons/ProjectDetailsSkeleton';
import ProjectFilesTab from '../../components/project/ProjectFilesTab';
import ProjectActivity from '../../components/project/ProjectActivity';
import GanttChart from '../../components/project/GanttChart';
import ReportGenerator from '../../components/reports/ReportGenerator';
import RAGManagement from '../../components/rag/RAGManagement';
import ReleaseSummaryGenerator from '../../components/project/ReleaseSummaryGenerator';
import ProjectListView from '../../components/project/ProjectListView';
import { connectSocket, subscribe, getSocket } from '../../services/socket';
import { subtaskService } from '../../services/api';

const ProjectDetailsPage = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const { theme } = useTheme();
  const {
    getProjectStatus,
    getProjectStatusBadgeComponent,
    getTaskTypeBadgeComponent,
    getTaskStatusText,
    getDeadlineStatusComponent,
    calculateDeadlineTextComponent,
    getTableHeaderClasses,
    getTableHeaderTextClasses,
    getTableRowClasses,
    getTableTextClasses,
    getTableSecondaryTextClasses,
    isMe,
    formatDateUTC,
    formatDate,
    getUserInitials,
    formatTimeAgo,
    userDetails,
    setProjects,
    openAddTaskModal
  } = useGlobal();
  const { showToast } = useToast();
  const [project, setProject] = useState(null);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [orgTeams, setOrgTeams] = useState([]);
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState('');
  const [search, setSearch] = useState('');
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
  const [confirmProjectName, setConfirmProjectName] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingProject, setDeletingProject] = useState(false);
  const [archivingProject, setArchivingProject] = useState(false);
  const [activeDeleteTab, setActiveDeleteTab] = useState('archive'); // 'archive' or 'delete'
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    Name: '',
    Description: '',
    DueDate: '',
    ProjectStatusID: 1 // Default to 'Not Assigned'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removingTeam, setRemovingTeam] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);


  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokingTeam, setRevokingTeam] = useState(null);
  const [taskList, setTaskList] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [deletingTask, setDeletingTask] = useState(false);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('manage');
  const [selectedUserStory, setSelectedUserStory] = useState('all');
  const [showDeleteUserStoryDialog, setShowDeleteUserStoryDialog] = useState(false);
  const [userStoryToDelete, setUserStoryToDelete] = useState(null);
  const [deletingUserStory, setDeletingUserStory] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [filteredAvailableTeams, setFilteredAvailableTeams] = useState([]);
  const [isTeamInputFocused, setIsTeamInputFocused] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  // Accordion state for List view - dynamically set based on task availability
  const [openAccordions, setOpenAccordions] = useState({});

  // Initialize accordion state based on task availability
  useEffect(() => {
    if (taskList) {
      const statusCodes = [1, 2, 3, 4, 5, 6];
      const newAccordionState = {};

      statusCodes.forEach(code => {
        const tasksByStatus = taskList.filter(t => t.Status === code);
        // Only open accordions that have tasks
        newAccordionState[code] = tasksByStatus.length > 0;
      });

      setOpenAccordions(newAccordionState);
    }
  }, [taskList]);

  // Toggle accordion state
  const toggleAccordion = (statusCode) => {
    setOpenAccordions(prev => ({
      ...prev,
      [statusCode]: !prev[statusCode]
    }));
  };

  // Subtask toggle state
  const [togglingSubtasks, setTogglingSubtasks] = useState(new Set());

  // Toggle subtask completion status
  const handleSubtaskToggle = async (subtaskId, parentTaskId) => {
    if (togglingSubtasks.has(subtaskId)) return; // Prevent multiple clicks

    setTogglingSubtasks(prev => new Set(prev).add(subtaskId));

    try {
      await subtaskService.toggleSubtask(subtaskId);

      // Update local state immediately for better UX
      setTaskList(prevTasks =>
        prevTasks.map(task => {
          if (task.TaskID === parentTaskId) {
            return {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.SubtaskID === subtaskId
                  ? {
                    ...subtask,
                    IsCompleted: !subtask.IsCompleted,
                    CompletedBy: !subtask.IsCompleted ? userDetails._id : null,
                    CompletedByDetails: !subtask.IsCompleted ? {
                      _id: userDetails._id,
                      fullName: `${userDetails.firstName} ${userDetails.lastName}`
                    } : null
                  }
                  : subtask
              )
            };
          }
          return task;
        })
      );

      showToast(
        `Subtask ${togglingSubtasks.has(subtaskId) ? 'completed' : 'uncompleted'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling subtask:', error);
      showToast('Failed to update subtask status', 'error');
    } finally {
      setTogglingSubtasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(subtaskId);
        return newSet;
      });
    }
  };
  // Team members state
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  // Project members state
  const [projectMembers, setProjectMembers] = useState([]);
  // GitHub Repository state
  const [projectRepository, setProjectRepository] = useState(null);
  const [userRepositories, setUserRepositories] = useState([]);
  const [showRepositoryModal, setShowRepositoryModal] = useState(false);
  const [showRepositoryList, setShowRepositoryList] = useState(false);
  const [repositoryLoading, setRepositoryLoading] = useState(false);
  const [linkingRepository, setLinkingRepository] = useState(false);
  const [unlinkingRepository, setUnlinkingRepository] = useState(false);
  // Repository commits state
  const [commits, setCommits] = useState([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [commitsPage, setCommitsPage] = useState(1);
  const [hasMoreCommits, setHasMoreCommits] = useState(true);
  const [commitsTotalPages, setCommitsTotalPages] = useState(1);
  const [commitsPerPage] = useState(10);
  // Repository issues state
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesPage, setIssuesPage] = useState(1);
  const [hasMoreIssues, setHasMoreIssues] = useState(true);
  const [projectActivity, setProjectActivity] = useState([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoalText, setEditingGoalText] = useState('');
  const [hasMoreActivities, setHasMoreActivities] = useState(false);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);

  // Sorting state for Tasks table
  const [tasksSortKey, setTasksSortKey] = useState('assignedDate'); // name | assignedTo | assignedDate | priority | status
  const [tasksSortDir, setTasksSortDir] = useState('desc'); // asc | desc


  // Helper to convert hex color to rgba with alpha for subtle backgrounds
  const hexToRgba = (hex, alpha = 0.08) => {
    try {
      if (!hex) return undefined;
      let c = hex.trim();
      if (c.startsWith('#')) c = c.slice(1);
      if (c.length === 3) {
        c = c.split('').map(ch => ch + ch).join('');
      }
      const num = parseInt(c, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (_) {
      return undefined;
    }
  };

  // Join project room and subscribe to project-level task updates to keep counts and lists fresh
  useEffect(() => {
    if (!projectId) return;
    connectSocket();
    try { getSocket().emit('project.join', { projectId }); } catch (_) { }
    const offCreated = subscribe('kanban.task.created', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      if (data.task.Type === 'User Story') {
        setUserStories(prev => {
          if (prev.some(t => t.TaskID === data.task.TaskID)) return prev;
          return [...prev, data.task];
        });
      } else {
        setTaskList(prev => {
          if (prev.some(t => t.TaskID === data.task.TaskID)) return prev;
          return [...prev, data.task];
        });
      }
    });
    const offUpdated = subscribe('kanban.task.updated', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      if (data.task.Type === 'User Story') {
        setUserStories(prev => {
          const exists = prev.some(t => t.TaskID === data.task.TaskID);
          if (exists) {
            return prev.map(t => t.TaskID === data.task.TaskID ? { ...t, ...data.task } : t);
          } else {
            return [...prev, data.task];
          }
        });
        setTaskList(prev => prev.filter(t => t.TaskID !== data.task.TaskID));
      } else {
        setTaskList(prev => {
          const exists = prev.some(t => t.TaskID === data.task.TaskID);
          if (exists) {
            return prev.map(t => t.TaskID === data.task.TaskID ? { ...t, ...data.task } : t);
          } else {
            return [...prev, data.task];
          }
        });
        setUserStories(prev => prev.filter(t => t.TaskID !== data.task.TaskID));
      }
    });
    const offStatus = subscribe('kanban.task.status.updated', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      setTaskList(prev => prev.map(t => t.TaskID === data.taskId ? { ...t, Status: data.status } : t));
      setUserStories(prev => prev.map(t => t.TaskID === data.taskId ? { ...t, Status: data.status } : t));
    });
    const offDeleted = subscribe('kanban.task.deleted', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      setTaskList(prev => prev.filter(t => t.TaskID !== data.taskId));
      setUserStories(prev => prev.filter(t => t.TaskID !== data.taskId));
    });
    const offAssigned = subscribe('kanban.task.assigned', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      setTaskList(prev => prev.map(t => t.TaskID === data.taskId ? { ...t, AssignedTo: data.assignedTo, AssignedToDetails: data.assignedToDetails || null, Status: data.status } : t));
      setUserStories(prev => prev.map(t => t.TaskID === data.taskId ? { ...t, AssignedTo: data.assignedTo, AssignedToDetails: data.assignedToDetails || null, Status: data.status } : t));
    });
    return () => {
      offCreated && offCreated();
      offUpdated && offUpdated();
      offStatus && offStatus();
      offDeleted && offDeleted();
      offAssigned && offAssigned();
      try { getSocket().emit('project.leave', { projectId }); } catch (_) { }
    };
  }, [projectId]);

  // SWR-based query for dynamic project details
  const { data: projectDetailsData, error: fetchError } = useSWR(
    projectId ? `/project-details/${projectId}` : null,
    null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  );

  const loading = !projectDetailsData && !fetchError && !project && !!projectId;

  // Sync SWR projectDetailsData with component local states
  useEffect(() => {
    if (projectDetailsData) {
      setProject(projectDetailsData.project);
      setTeams(projectDetailsData.teams);
      setOrgTeams(projectDetailsData.orgTeams);
      setTaskList(projectDetailsData.taskList);
      setUserStories(projectDetailsData.userStories);
      setProjectMembers(projectDetailsData.projectMembers || []);
      setProjectActivity(projectDetailsData.activity || []);
      setHasMoreActivities(projectDetailsData.hasMoreActivities || false);
      setActiveTab('manage');
    }
  }, [projectDetailsData]);

  // Handle fetching error states
  useEffect(() => {
    if (fetchError) {
      setError('Failed to fetch project');
      router.push('/dashboard');
    }
  }, [fetchError, router]);


  // Fetch project repository information
  useEffect(() => {
    if (projectId && userDetails) {
      fetchProjectRepository();
    }
  }, [projectId, userDetails]);

  // Fetch commits and issues when repository is connected
  useEffect(() => {
    if (projectRepository?.connected) {
      fetchCommits(1);
      if (activeTab === 'repo') {
        fetchIssues(1);
      }
    }
  }, [activeTab, projectRepository]);

  // Handle clicking outside repository dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRepositoryList) {
        const dropdown = event.target.closest('[data-repository-dropdown]');
        if (!dropdown) {
          setShowRepositoryList(false);
        }
      }
    };

    if (showRepositoryList) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRepositoryList]);



  const handleLoadMoreActivities = async () => {
    if (loadingMoreActivities) return;
    setLoadingMoreActivities(true);
    try {
      const response = await api.get(`/project-details/${projectId}/activities`, {
        params: {
          limit: 20,
          skip: projectActivity.length
        }
      });
      setProjectActivity(prev => [...prev, ...(response.data.activities || [])]);
      setHasMoreActivities(response.data.hasMore);
    } catch (err) {
      showToast('Failed to load more activities', 'error');
    } finally {
      setLoadingMoreActivities(false);
    }
  };

  const fetchProjectRepository = async () => {
    try {
      setRepositoryLoading(true);
      const response = await authService.getProjectRepository(projectId);
      if (response.success) {
        setProjectRepository(response.repository);
      }
    } catch (error) {
      console.error('Error fetching project repository:', error);
    } finally {
      setRepositoryLoading(false);
    }
  };

  const fetchUserRepositories = async () => {
    try {
      setRepositoryLoading(true);
      const response = await authService.getUserRepositories(userDetails._id);
      if (response.success) {
        setUserRepositories(response.repositories);
        setShowRepositoryList(true);
      } else {
        showToast(response.error || 'Failed to fetch repositories', 'error');
      }
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      showToast('Failed to fetch repositories', 'error');
    } finally {
      setRepositoryLoading(false);
    }
  };

  const handleLinkRepository = async (repository) => {
    try {
      setLinkingRepository(true);
      const response = await authService.linkRepositoryToProject(projectId, repository, userDetails._id);
      if (response.success) {
        setProjectRepository(response.project.githubRepository);
        setShowRepositoryModal(false);
        setShowRepositoryList(false);
        showToast('Repository linked successfully', 'success');
      } else {
        showToast(response.error || 'Failed to link repository', 'error');
      }
    } catch (error) {
      console.error('Error linking repository:', error);
      showToast('Failed to link repository', 'error');
    } finally {
      setLinkingRepository(false);
    }
  };

  const handleUnlinkRepository = async () => {
    try {
      setUnlinkingRepository(true);
      const response = await authService.unlinkRepositoryFromProject(projectId);
      if (response.success) {
        setProjectRepository(null);
        showToast('Repository unlinked successfully', 'success');
      } else {
        showToast(response.error || 'Failed to unlink repository', 'error');
      }
    } catch (error) {
      console.error('Error unlinking repository:', error);
      showToast('Failed to unlink repository', 'error');
    } finally {
      setUnlinkingRepository(false);
    }
  };

  // Fetch commits from repository
  const fetchCommits = async (page = 1) => {
    if (!projectRepository) return;

    try {
      setCommitsLoading(true);
      const response = await githubService.getProjectCommits(projectId, page, commitsPerPage);
      if (response.success) {
        setCommits(response.commits);
        setCommitsPage(page);
        setHasMoreCommits(response.pagination.has_next);
        // Estimate total pages based on current page and has_next
        if (response.pagination.has_next) {
          setCommitsTotalPages(page + 1);
        } else {
          setCommitsTotalPages(page);
        }
      } else {
        showToast(response.error || 'Failed to fetch commits', 'error');
      }
    } catch (error) {
      console.error('Error fetching commits:', error);
      showToast('Failed to fetch commits', 'error');
    } finally {
      setCommitsLoading(false);
    }
  };

  // Fetch issues from repository
  const fetchIssues = async (page = 1) => {
    if (!projectRepository) return;

    try {
      setIssuesLoading(true);
      const response = await githubService.getProjectIssues(projectId, page, 20);
      if (response.success) {
        if (page === 1) {
          setIssues(response.issues);
        } else {
          setIssues(prev => [...prev, ...response.issues]);
        }
        setHasMoreIssues(response.pagination.has_next);
        setIssuesPage(page);
      } else {
        showToast(response.error || 'Failed to fetch issues', 'error');
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      showToast('Failed to fetch issues', 'error');
    } finally {
      setIssuesLoading(false);
    }
  };

  const handleToggleGoal = async (goalId) => {
    if (!project) return;
    const updatedGoals = project.Goals.map(g => g._id === goalId ? { ...g, completed: !g.completed } : g);
    try {
      const res = await api.patch(`/projects/${projectId}`, { Goals: updatedGoals });
      setProject(res.data);
      showToast('Goal updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update goal', 'error');
    }
  };

  const handleAddGoalDirect = async () => {
    if (!newGoalText.trim()) return;
    const updatedGoals = [...(project.Goals || []), { text: newGoalText.trim(), completed: false }];
    try {
      const res = await api.patch(`/projects/${projectId}`, { Goals: updatedGoals });
      setProject(res.data);
      setNewGoalText('');
      showToast('Goal added successfully', 'success');
    } catch (err) {
      showToast('Failed to add goal', 'error');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!project) return;
    const updatedGoals = project.Goals.filter(g => g._id !== goalId);
    try {
      const res = await api.patch(`/projects/${projectId}`, { Goals: updatedGoals });
      setProject(res.data);
      showToast('Goal deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete goal', 'error');
    }
  };

  const handleUpdateGoalText = async (goalId, newText) => {
    if (!project) return;
    const originalGoal = project.Goals.find(g => g._id === goalId);
    if (!originalGoal) return;
    if (!newText.trim() || newText.trim() === originalGoal.text) {
      setEditingGoalId(null);
      return;
    }
    const updatedGoals = project.Goals.map(g => g._id === goalId ? { ...g, text: newText.trim() } : g);
    try {
      const res = await api.patch(`/projects/${projectId}`, { Goals: updatedGoals });
      setProject(res.data);
      setEditingGoalId(null);
      showToast('Goal updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update goal', 'error');
    }
  };

  // Load more commits
  const loadMoreCommits = () => {
    if (!commitsLoading && hasMoreCommits) {
      fetchCommits(commitsPage + 1);
    }
  };

  // Pagination functions for commits
  const goToCommitsPage = (page) => {
    if (page >= 1 && page <= commitsTotalPages && !commitsLoading) {
      fetchCommits(page);
    }
  };

  const nextCommitsPage = () => {
    if (commitsPage < commitsTotalPages && !commitsLoading) {
      fetchCommits(commitsPage + 1);
    }
  };

  const prevCommitsPage = () => {
    if (commitsPage > 1 && !commitsLoading) {
      fetchCommits(commitsPage - 1);
    }
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, onNext, onPrev, loading }) => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-1 mt-6">
        <button
          onClick={onPrev}
          disabled={currentPage === 1 || loading}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${currentPage === 1 || loading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-transparent dark:text-gray-500 dark:border-gray-700"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800/40 dark:border-gray-700"}`}
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
            disabled={page === '...' || loading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === '...'
              ? "text-gray-400 cursor-default dark:text-gray-500"
              : page === currentPage
                ? "bg-blue-600 text-white dark:bg-blue-600 dark:text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800/40 dark:border-gray-700"}`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={onNext}
          disabled={currentPage === totalPages || loading}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${currentPage === totalPages || loading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-transparent dark:text-gray-500 dark:border-gray-700"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800/40 dark:border-gray-700"}`}
        >
          Next
        </button>
      </div>
    );
  };

  // Load more issues
  const loadMoreIssues = () => {
    if (!issuesLoading && hasMoreIssues) {
      fetchIssues(issuesPage + 1);
    }
  };

  // Format issue date
  const formatIssueDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get short SHA
  const getShortSha = (sha) => {
    return sha.substring(0, 7);
  };

  // Get issue status badge
  const getIssueStatusBadge = (state) => {
    const isOpen = state === 'open';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOpen
        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
        {isOpen ? 'Open' : 'Closed'}
      </span>
    );
  };

  // Group commits by date
  const groupCommitsByDate = (commits) => {
    const groups = {};
    commits.forEach(commit => {
      const date = new Date(commit.author.date);
      const dateKey = date.toDateString();
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      let displayDate;
      if (dateKey === today) {
        displayDate = 'Today';
      } else if (dateKey === yesterday) {
        displayDate = 'Yesterday';
      } else {
        displayDate = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      if (!groups[displayDate]) {
        groups[displayDate] = [];
      }
      groups[displayDate].push(commit);
    });
    return groups;
  };


  useEffect(() => {
    setFilteredTeams([]);
  }, [orgTeams, teams]);

  // Filter teams as search changes
  useEffect(() => {
    if (!isInputFocused) {
      setFilteredTeams([]);
      return;
    }
    if (!search) {
      // Show first 10 available teams by default
      const assignedIds = new Set(teams.map(t => t.TeamID));
      const availableTeams = orgTeams.filter(t => !assignedIds.has(t.TeamID));
      setFilteredTeams(availableTeams.slice(0, 10));
      return;
    }
    const s = search.toLowerCase();
    const assignedIds = new Set(teams.map(t => t.TeamID));
    const matchingTeams = orgTeams.filter(t =>
      !assignedIds.has(t.TeamID) && (
        (t.TeamName && t.TeamName.toLowerCase().includes(s)) ||
        (t.TeamDescription && t.TeamDescription.toLowerCase().includes(s)) ||
        (t.TeamID && t.TeamID.toLowerCase().includes(s))
      )
    );
    setFilteredTeams(matchingTeams.slice(0, 10));
  }, [search, orgTeams, teams, isInputFocused]);

  // Filter available teams for dropdown
  useEffect(() => {
    if (!isTeamInputFocused) {
      setFilteredAvailableTeams([]);
      return;
    }

    if (!teamSearch) {
      // When search is empty, show first 10 teams by default
      const assignedIds = new Set(teams.map(t => t.TeamID));
      const availableTeams = orgTeams.filter(t => !assignedIds.has(t.TeamID));
      setFilteredAvailableTeams(showAllTeams ? availableTeams : availableTeams.slice(0, 10));
      return;
    }

    const s = teamSearch.toLowerCase();
    // Exclude teams that are already assigned
    const assignedIds = new Set(teams.map(t => t.TeamID));
    const matchingTeams = orgTeams.filter(t =>
      !assignedIds.has(t.TeamID) && (
        (t.TeamName && t.TeamName.toLowerCase().includes(s)) ||
        (t.TeamDescription && t.TeamDescription.toLowerCase().includes(s)) ||
        (t.TeamID && t.TeamID.toLowerCase().includes(s))
      )
    );
    setFilteredAvailableTeams(showAllTeams ? matchingTeams : matchingTeams.slice(0, 10));
  }, [teamSearch, orgTeams, teams, showAllTeams, isTeamInputFocused]);

  // Calculate deadline timer
  useEffect(() => {
    if (project && project.DueDate) {
      const interval = setInterval(() => {
        setDeadline(calculateDeadlineTextComponent(project.DueDate));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setDeadline('No Deadline');
    }
  }, [project, calculateDeadlineTextComponent]);

  const [projectPriorityOptions, setProjectPriorityOptions] = useState([
    { value: 0, label: 'Critical' },
    { value: 1, label: 'High' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'Low' }
  ]);

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const types = await commonTypeService.getPriorityTypes();
        if (Array.isArray(types) && types.length > 0) {
          const formatted = types
            .sort((a, b) => Number(a.Code) - Number(b.Code))
            .map(t => ({
              value: Number(t.Code),
              label: t.Value
            }));
          setProjectPriorityOptions(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch priority types from DB:', err);
      }
    };
    fetchPriorities();
  }, []);

  useEffect(() => {
    if (project) {
      setSettingsForm({
        Name: project.Name || '',
        Description: project.Description || '',
        DueDate: project.DueDate ? new Date(project.DueDate).toISOString().slice(0, 10) : '',
        ProjectStatusID: project.ProjectStatusID || 1,
        Priority: (project.Priority !== undefined && project.Priority !== null) ? Number(project.Priority) : 2
      });
    }
  }, [project]);

  const isOwner = userDetails && project && (String(userDetails._id) === String(project.ProjectOwner) || String(userDetails.id) === String(project.ProjectOwner) || userDetails.role === 'Admin');

  const tabs = [
    {
      id: 'manage',
      label: 'Manage Project',
      icon: (isActive) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M21 9H3" />
          <path d="M21 15H3" />
          <path d="M12 3v18" />
        </svg>
      )
    },
    {
      id: 'board',
      label: 'Kanban',
      hiddenMobile: true,
      icon: (isActive) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
          <path d="M3 3h6v18H3z" />
          <path d="M9 3h6v10H9z" />
          <path d="M15 3h6v15H15z" />
        </svg>
      )
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: (isActive) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M8 14h8" />
          <path d="M8 18h5" />
        </svg>
      )
    },
    {
      id: 'list',
      label: 'List View',
      icon: (isActive) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      )
    },
    {
      id: 'files',
      label: 'Files',
      icon: (isActive) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      icon: (isActive) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: (isActive) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      id: 'releases',
      label: 'Releases',
      show: isOwner,
      icon: (isActive) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
          <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M14 2s.5 2 2.5 4M10 14L3 21M22 2l-3 10-4 1-4-4 1-4 10-3z" />
        </svg>
      )
    }
  ];

  const visibleTabs = tabs.filter(tab => tab.show !== false);

  const handleAddTeam = async (teamId) => {
    if (!teamId) return;
    setAdding(true);
    setError('');
    try {
      const res = await api.post(`/project-details/${projectId}/team/${teamId}`);

      if (res.data.success) {
        showToast(res.data.message, 'success');
        setTeams(prev => [...prev, { ...res.data }]);
        setProjectMembers(res.data.projectMembers);
        // Update project state if status was changed
        if (res.data.statusUpdated) {
          setProject(prev => ({ ...prev, ProjectStatusID: 2 })); // Update to Assigned status
        }
      }
      else {
        setError(res.data.error);
      }

      setShowAddTeamDialog(false);
      setSelectedTeam(null);
      setSearch('');
      setIsInputFocused(false);
      setTeamSearch('');
      setIsTeamInputFocused(false);
      setFilteredAvailableTeams([]);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add team');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTeamStatus = async (teamId) => {
    setToggling(teamId);
    setError('');
    try {
      const res = await api.patch(`/project-details/${projectId}/team/${teamId}/toggle`);

      if (res.data.success) {
        setTeams(prev => prev.map(team => {
          if (team.TeamID === teamId) {
            return {
              ...team,
              IsActive: res.data.currentStatus
            };
          }
          return team;
        }));
        setProjectMembers(res.data.projectMembers);
        showToast('Team access updated successfully', 'success');
      }
      else {
        setError(res.data.error);
      }
      setShowRevokeDialog(false);
      setRevokingTeam(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update team status');
      showToast(err?.response?.data?.error || 'Failed to update team status', 'error');
    } finally {
      setToggling('');
    }
  };

  const handleOpenModal = () => {
    setShowSettingsModal(true);
    setIsModalOpening(true);
    setTimeout(() => {
      setIsModalOpening(false);
    }, 300); // Match the animation duration
  };

  const handleCloseModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowSettingsModal(false);
      setIsModalClosing(false);
    }, 300); // Match the animation duration
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.patch(`/projects/${project.ProjectID}`, {
        Name: settingsForm.Name,
        Description: settingsForm.Description,
        DueDate: settingsForm.DueDate,
        ProjectStatusID: settingsForm.ProjectStatusID,
        ModifiedBy: userDetails._id,
        ModifiedDate: new Date(),
        Priority: settingsForm.Priority
      });
      setProjects(prev => prev.map(p => p.ProjectID === project.ProjectID ? res.data : p));
      setProject(res.data);
      handleCloseModal();
      showToast('Project details updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update project details', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeletingProject(true);
    try {
      const { projectService } = await import('../../services/api');
      await projectService.deleteProject(project.ProjectID, deleteReason);
      setProjects(prev => prev.filter(p => p.ProjectID !== project.ProjectID));
      showToast('Project deleted successfully', 'success');
      router.push('/dashboard');
    } catch (err) {
      showToast(err?.error || 'Failed to delete project', 'error');
    } finally {
      setDeletingProject(false);
      setShowDeleteProjectConfirm(false);
      setDeleteReason('');
      setActiveDeleteTab('archive');
    }
  };

  const handleArchiveProject = async () => {
    setArchivingProject(true);
    try {
      const { projectService } = await import('../../services/api');
      const res = await projectService.archiveProject(project.ProjectID, true);
      setProjects(prev => prev.map(p => p.ProjectID === project.ProjectID ? res.project : p));
      showToast('Project archived successfully', 'success');
      router.push('/dashboard');
    } catch (err) {
      showToast(err?.error || 'Failed to archive project', 'error');
    } finally {
      setArchivingProject(false);
      setShowDeleteProjectConfirm(false);
      setActiveDeleteTab('archive');
    }
  };

  const handleUnarchiveProject = async () => {
    setArchivingProject(true);
    try {
      const { projectService } = await import('../../services/api');
      const res = await projectService.archiveProject(project.ProjectID, false);
      setProject(res.project);
      setProjects(prev => prev.map(p => p.ProjectID === project.ProjectID ? res.project : p));
      showToast('Project unarchived successfully', 'success');
      handleCloseModal();
    } catch (err) {
      showToast(err?.error || 'Failed to unarchive project', 'error');
    } finally {
      setArchivingProject(false);
    }
  };

  const handleToggleProjectStatus = async () => {
    setTogglingStatus(true);
    try {
      const res = await api.patch(`/projects/${project.ProjectID}/toggle-status`);
      setProjects(prev => prev.map(p => p.ProjectID === project.ProjectID ? res.data : p));
      setProject(res.data);
      handleCloseModal();
    } catch (err) {
      alert('Failed to update project status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    setRemoving(true);
    setError('');
    try {
      const res = await api.delete(`/project-details/${projectId}/team/${teamId}`);

      if (res.data.success) {
        setTeams(prev => prev.filter(team => team.TeamID !== teamId));
        setProjectMembers(res.data.projectMembers);
        if (Array.isArray(res.data.updatedTasks) && res.data.updatedTasks.length > 0) {
          // Update taskList with unassigned tasks coming from server
          setTaskList(prev => prev.map(t => {
            const u = res.data.updatedTasks.find(x => x.TaskID === t.TaskID);
            return u ? { ...t, AssignedTo: null, AssignedToDetails: null, AssignedDate: null, Status: 1 } : t;
          }));
        }
        showToast(res.data.message, 'success');
      }
      else {
        setError(res.data.error);
      }

      setShowRemoveDialog(false);
      setRemovingTeam(null);

    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove team');
    } finally {
      setRemoving(false);
    }
  };

  // const fetchProjectTasks = async (projectId) => {
  //   try {
  //     const { tasks: kanbanTasks, userStories: kanbanUserStories } = await taskService.getKanbanData(projectId);
  //     setUserStories(kanbanUserStories || []);
  //     setTaskList(kanbanTasks || []);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  // useEffect(() => {
  //   if (projectId) {
  //     fetchProjectTasks(projectId);
  //   }
  // }, [projectId]);

  const handleAddTask = async (taskData) => {
    try {
      const newTask = await taskService.addTaskDetails(taskData);
      const typeLabel = newTask.Type === 'User Story' ? 'User Story' : 'Task';
      showToast(`${typeLabel} added successfully!`, 'success', 5000, {
        description: `${typeLabel} "${newTask?.Name || taskData?.Name || ''}" has been created.`,
        action: {
          label: 'View',
          onClick: () => router.push(`/task/${newTask.TaskID}`)
        }
      });

      // Update task list directly instead of refetching --commenting below lines to fix duplicate task entries in case of socket.io
      // if (newTask.Type === 'User Story') {
      //   setUserStories(prev => [...prev, newTask]);
      // } else {
      //   setTaskList(prev => [...prev, newTask]);
      // }     

      return newTask; // Return the new task for the modal to handle
    } catch (err) {
      if (err.status == 403) {
        showToast(err.message, 'warning');
      } else {
        showToast('Failed to add task', 'error');
      }
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const updatedTask = await taskService.updateTask(taskId, taskData);
      showToast('Task updated successfully!', 'success');

      // Update task list directly instead of refetching
      if (updatedTask.Type === 'User Story') {
        setUserStories(prev => prev.map(task =>
          task.TaskID === taskId ? updatedTask : task
        ));
      } else {
        setTaskList(prev => prev.map(task =>
          task.TaskID === taskId ? updatedTask : task
        ));
      }
    } catch (err) {
      showToast('Failed to update task', 'error');
    }
  };

  // Update the table container classes - transparent background with borders to blend with page
  const tableContainerClasses = 'rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-zinc-800/80 dark:bg-dark-bg dark:shadow-none dark:overflow-hidden';

  // Table styling classes from GlobalContext for consistency
  const tableHeaderClasses = getTableHeaderClasses();
  const tableHeaderTextClasses = getTableHeaderTextClasses();
  const tableRowClasses = getTableRowClasses();
  const tableTextClasses = getTableTextClasses();
  const tableSecondaryTextClasses = getTableSecondaryTextClasses();


  // Function to handle task deletion
  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      showToast('Task deleted successfully', 'success');
      // Refresh tasks
      setTaskList(prev => prev.filter(task => task.TaskID !== taskId));
      setUserStories(prev => prev.filter(task => task.TaskID !== taskId));
      // Close the modal
      setShowDeleteTaskDialog(false);
      setTaskToDelete(null);
    } catch (err) {
      showToast('Failed to delete task: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  // Function to open the delete task confirmation dialog
  const confirmDeleteTask = (task) => {
    setTaskToDelete(task);
    setShowDeleteTaskDialog(true);
  };

  // Function to open edit task modal
  const handleEditTask = (task) => {
    openAddTaskModal({
      mode: 'fromProject',
      projectIdDefault: projectId,
      userStories: userStories,
      editingTask: task,
      addTaskTypeMode: task?.Type === 'User Story' ? 'userStory' : 'task',
      projectMembers: projectMembers,
      onUpdateTask: handleUpdateTask
    });
  };

  // Function to handle task selection
  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      }
      return [...prev, taskId];
    });
  };

  // Function to handle select all tasks
  const handleSelectAllTasks = () => {
    if (selectedTasks.length === taskList.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(taskList.map(task => task.TaskID));
    }
  };

  // Function to handle bulk delete tasks
  const handleBulkDeleteTasks = async () => {
    if (selectedTasks.length === 0) return;
    setBulkDeleting(true);
    try {
      await taskService.bulkDeleteTasks(selectedTasks);
      showToast(`Successfully deleted ${selectedTasks.length} tasks`, 'success');

      // Update task list by removing deleted tasks
      setTaskList(prev => prev.filter(task => !selectedTasks.includes(task.TaskID)));
      setSelectedTasks([]);
      setShowBulkDeleteDialog(false);
    } catch (err) {
      showToast('Failed to delete tasks: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Tasks sorting helpers
  const handleTasksSort = (key) => {
    if (tasksSortKey === key) {
      setTasksSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTasksSortKey(key);
      setTasksSortDir('asc');
    }
  };

  const getTasksSortIcon = (key) => {
    if (tasksSortKey !== key) return <FaSort className={'text-gray-400 text-gray-500'} size={12} />;
    return tasksSortDir === 'asc'
      ? <FaSortUp className={'text-blue-600 text-blue-400'} size={12} />
      : <FaSortDown className={'text-blue-600 text-blue-400'} size={12} />;
  };

  const priorityRank = (p) => {
    const map = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return map[p] || 0;
  };

  const tasksSorted = useMemo(() => {
    const filtered = taskList.filter(t => t.Type !== 'User Story');
    const copy = [...filtered];
    const dir = tasksSortDir === 'asc' ? 1 : -1;
    // Always show Not Assigned (Status === 1) first
    copy.sort((a, b) => {
      const aUnassigned = a.Status === 1 ? 0 : 1;
      const bUnassigned = b.Status === 1 ? 0 : 1;
      if (aUnassigned !== bUnassigned) return aUnassigned - bUnassigned;
      const getAssignedTo = (t) => t.AssignedToDetails?.fullName || '';
      const getStatus = (t) => (t.Status || '').toString();
      switch (tasksSortKey) {
        case 'name':
          return (a.Name || '').localeCompare(b.Name || '') * dir;
        case 'assignedTo':
          return getAssignedTo(a).localeCompare(getAssignedTo(b)) * dir;
        case 'assignedDate': {
          const av = a.AssignedDate ? new Date(a.AssignedDate).getTime() : 0;
          const bv = b.AssignedDate ? new Date(b.AssignedDate).getTime() : 0;
          return (av - bv) * dir;
        }
        case 'dueDate': {
          const av = a.DueDate ? new Date(a.DueDate).getTime() : 0;
          const bv = b.DueDate ? new Date(b.DueDate).getTime() : 0;
          return (av - bv) * dir;
        }
        case 'priority':
          return (priorityRank(a.Priority) - priorityRank(b.Priority)) * dir;
        case 'status':
          return getStatus(a).localeCompare(getStatus(b)) * dir;
        default:
          return 0;
      }
    });
    return copy;
  }, [taskList, tasksSortKey, tasksSortDir]);

  // Function to handle user story deletion
  const handleDeleteUserStory = async (userStoryId) => {
    setDeletingUserStory(true);
    try {
      await taskService.deleteTask(userStoryId);
      showToast('User Story deleted successfully', 'success');
      // Update user stories list by removing deleted user story
      setUserStories(prev => prev.filter(story => story.TaskID !== userStoryId));
      setShowDeleteUserStoryDialog(false);
      setUserStoryToDelete(null);
    } catch (err) {
      showToast('Failed to delete user story: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setDeletingUserStory(false);
    }
  };

  // Function to open the delete user story confirmation dialog
  const confirmDeleteUserStory = (userStory) => {
    setUserStoryToDelete(userStory);
    setShowDeleteUserStoryDialog(true);
  };

  if (loading) {
    return <ProjectDetailsSkeleton />;
  }

  if (!project) {
    return <div className="p-8 text-red-500">Project not found.</div>;
  }

  const showUserStories = !!userStories;

  return (
    <>
      <Head>
        <title>Project - {project?.Name || 'Loading...'} | TeamLabs</title>
      </Head>
      <div className="mx-auto" data-project-id={projectId}>


        {/* Tab Navigation */}
        <div className="">
          <div className={`border-b border-gray-200 dark:border-gray-700`}>
            <div className="-mb-px flex items-center justify-between">
              <div className="flex-1 overflow-x-auto">
                <nav className="flex space-x-2 min-w-max ml-2 mt-2 pb-3 -mb-px">
                  {visibleTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${isActive
                          ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/80 shadow-xs'
                          : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-zinc-800/50'
                          } ${tab.hiddenMobile ? 'hidden sm:flex' : 'flex'} whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm items-center gap-2 transition-all duration-100 group relative`}
                      >
                        {tab.icon(isActive)}
                        <span>{tab.label}</span>
                        {isActive && (
                          <div className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                {activeTab === 'board' && (
                  <CustomDropdown
                    value={selectedUserStory}
                    onChange={(val) => setSelectedUserStory(val)}
                    options={[{ value: 'all', label: 'All user stories' }, ...(userStories || []).map(us => ({ value: us.TaskID, label: us.Name }))]}
                    placeholder={userStories.length === 0 ? 'No user stories' : 'Filter by user story'}
                    disabled={userStories.length === 0}
                    variant="filled"
                    size="md"
                    width="w-64"
                  />
                )}
                {isOwner && (
                  <>
                    <div className="py-2">
                      <button
                        className={"flex items-center gap-2 p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800"}
                        title="Project Settings"
                        onClick={handleOpenModal}
                      >
                        <FaCog size={18} />
                      </button>
                    </div>
                  </>

                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className='p-4'>
          {activeTab === 'manage' ? (
            <div>
              {/* Unified Top Layout Hero Banner (Details + KPI Progress + Goals) */}
              <div className={"mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm dark:bg-dark-bg dark:border-zinc-800/80 dark:shadow-none"}>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
                  {/* Left Section: Details */}
                  <div className="lg:col-span-3 flex flex-col justify-between gap-4 min-w-0 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
                    <div>
                      {/* Top Row: Statuses */}
                      <div className="flex items-center justify-between mb-4">
                        {/* Left: Project Status & Priority */}
                        <div className="flex items-center gap-2">
                          {project && (() => {
                            const statusStyle = getProjectStatusStyle(project.ProjectStatusID);
                            const statusDetails = getProjectStatus(project.ProjectStatusID) || { Value: 'NOT ASSIGNED' };
                            const StatusIcon = statusStyle.icon;
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gradient-to-r ${statusStyle.bgColor} ${statusStyle.textColor} border ${statusStyle.borderColor}`}>
                                <StatusIcon className={statusStyle.iconColor} size={12} />
                                {statusDetails.Value}
                              </span>
                            );
                          })()}
                          {project && <ProjectPriorityBadge priority={project.Priority} showLabel={true} />}
                        </div>

                        {/* Right: Deadline Status */}
                        {project.DueDate && (
                          <div>
                            {(() => {
                              const status = getDeadlineStatusComponent(deadline);
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                                  <FiClock size={12} className={status.textColor} />
                                  {status.text}
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Middle Row: Name & Description */}
                      <div className="space-y-2">
                        <h1 className={"text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3 dark:text-white flex items-center gap-3"}>
                          <span>{project.Name}</span>
                          {project.isArchived && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-150 text-zinc-800 border border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700">
                              Archived
                            </span>
                          )}
                        </h1>
                        {project.Description ? (
                          <p className={"text-sm text-gray-600 leading-relaxed max-w-2xl dark:text-gray-300"}>
                            {project.Description}
                          </p>
                        ) : (
                          <p className={"text-sm text-gray-400 italic dark:text-gray-500"}>
                            No description provided.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Members & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 mt-6 border-t border-gray-100 dark:border-zinc-800/80">
                      {/* Left: Project Members Avatars */}
                      {projectMembers.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {projectMembers.slice(0, 4).map((member, idx) => (
                              <div
                                key={member._id}
                                className={"w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden bg-gradient-to-r from-purple-500 to-purple-700 dark:border-zinc-800"}
                                style={{ marginLeft: idx === 0 ? '0' : '-8px' }}
                                title={`${member.firstName} ${member.lastName}`}
                              >
                                {member.profileImage ? (
                                  <img
                                    src={member.profileImage}
                                    alt={`${member.firstName} ${member.lastName}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-semibold text-white">
                                    {getUserInitials(member)}
                                  </span>
                                )}
                              </div>
                            ))}
                            {projectMembers.length > 4 && (
                              <div className={"w-8 h-8 flex items-center justify-center px-2 py-1 rounded-full bg-gray-100 border border-gray-200 shadow-sm dark:bg-zinc-800 dark:border-zinc-700"}
                                style={{ marginLeft: '-8px' }}>
                                <span className={"text-xs font-semibold text-gray-600 dark:text-gray-300"}>
                                  +{projectMembers.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500">No members assigned</div>
                      )}

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <button
                            onClick={handleOpenModal}
                            className="p-1.5 text-black dark:text-white hover:bg-blue-100/70 dark:hover:bg-zinc-700/80 rounded-lg transition-all duration-200 hover:shadow-sm"
                            title="Edit Project"
                          >
                            <FaEdit size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast('Project link copied to clipboard!', 'success');
                          }}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100/70 dark:hover:bg-zinc-700/80 rounded-lg transition-all duration-200 hover:shadow-sm"
                          title="Share Project"
                        >
                          <FiShare2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section: Circular Progress */}
                  <div className="lg:col-span-1 flex flex-col justify-between gap-4 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
                    {/* Progress Circle & Text */}
                    {(() => {
                      const totalTasksCount = taskList.length;
                      const completedTasksCount = taskList.filter(t => t.Status === 6).length;
                      const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

                      const radius = 54;
                      const strokeWidth = 10;
                      const C = 2 * Math.PI * radius; // 339.29
                      const gap = 12;

                      let greenLength = 0;
                      let grayLength = 0;
                      let greenOffset = 0;
                      let grayOffset = 0;

                      if (progressPercent === 100) {
                        greenLength = C;
                        grayLength = 0;
                      } else if (progressPercent === 0) {
                        greenLength = 0;
                        grayLength = C;
                      } else {
                        greenLength = (progressPercent / 100) * C - gap;
                        grayLength = ((100 - progressPercent) / 100) * C - gap;
                        greenOffset = -gap / 2;
                        grayOffset = -(greenLength + 1.5 * gap);
                      }

                      let healthText = 'On Track';
                      let healthColor = 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
                      if (deadline === 'Deadline Passed' && progressPercent < 100) {
                        healthText = 'Overdue';
                        healthColor = 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
                      } else if (deadline !== 'No Deadline' && progressPercent < 40 && !deadline.includes('Days Left')) {
                        healthText = 'Needs Attention';
                        healthColor = 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
                      }

                      return (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                          <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              {/* Gray remainder path */}
                              {grayLength > 0 && (
                                <circle
                                  cx="64"
                                  cy="64"
                                  r={radius}
                                  className="text-gray-100 dark:text-zinc-800"
                                  strokeWidth={strokeWidth}
                                  strokeDasharray={`${grayLength} ${C}`}
                                  strokeDashoffset={grayOffset}
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                />
                              )}
                              {/* Emerald progress path */}
                              {greenLength > 0 && (
                                <circle
                                  cx="64"
                                  cy="64"
                                  r={radius}
                                  className="text-emerald-500 dark:text-emerald-400"
                                  strokeWidth={strokeWidth}
                                  strokeDasharray={`${greenLength} ${C}`}
                                  strokeDashoffset={greenOffset}
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                />
                              )}
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center text-center">
                              <span className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                                {progressPercent}%
                              </span>
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-1">
                                Progress
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-1.5 text-center">
                            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${healthColor}`}>
                              {healthText}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {completedTasksCount} of {totalTasksCount} tasks completed
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Task counts details */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                      <div className="p-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/80 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">In Progress</span>
                        <span className="text-md font-bold text-gray-900 dark:text-white">
                          {taskList.filter(t => t.Status === 3).length}
                        </span>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/80 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">User Stories</span>
                        <span className="text-md font-bold text-gray-900 dark:text-white">
                          {userStories.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Goals Tracker */}
                  <div className="lg:col-span-1 flex flex-col justify-between gap-4">
                    <div>
                      {/* Inline Goals Title Badge */}
                      <div className="flex items-center gap-1.5 mb-4 border-b border-gray-100 dark:border-zinc-800/80 pb-3">
                        <FaFlag className="text-blue-500 dark:text-blue-400 w-3.5 h-3.5" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Project Goals</span>
                      </div>

                      {/* Goals List */}
                      <div className="space-y-3.5 overflow-y-auto pr-1 max-h-[170px]">
                        {!project?.Goals || project.Goals.length === 0 ? (
                          <p className={"text-xs text-gray-400 italic dark:text-gray-500"}>No goals defined for this project.</p>
                        ) : (
                          project.Goals.map((goal) => (
                            <div key={goal._id} className="flex items-center justify-between gap-3 group">
                              {editingGoalId === goal._id ? (
                                <input
                                  type="text"
                                  value={editingGoalText}
                                  onChange={(e) => setEditingGoalText(e.target.value)}
                                  onBlur={() => handleUpdateGoalText(goal._id, editingGoalText)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateGoalText(goal._id, editingGoalText);
                                    if (e.key === 'Escape') setEditingGoalId(null);
                                  }}
                                  className="flex-1 px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span
                                      role="checkbox"
                                      aria-checked={!!goal.completed}
                                      tabIndex={isOwner ? 0 : -1}
                                      onClick={() => isOwner && handleToggleGoal(goal._id)}
                                      onKeyDown={(e) => { if (isOwner && (e.key === 'Enter' || e.key === ' ')) handleToggleGoal(goal._id); }}
                                      className={`inline-flex items-center justify-center w-4 h-4 rounded-full border flex-shrink-0 ${goal.completed ? 'bg-green-600 border-transparent' : 'bg-white dark:bg-transparent border-gray-300 dark:border-gray-600'} ${isOwner ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                      {goal.completed ? (
                                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-white" fill="currentColor">
                                          <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L8.5 12.086l6.793-6.793a1 1 0 0 1 1.414 0Z" />
                                        </svg>
                                      ) : null}
                                    </span>
                                    <span
                                      onClick={() => {
                                        if (isOwner) {
                                          setEditingGoalId(goal._id);
                                          setEditingGoalText(goal.text);
                                        }
                                      }}
                                      className={`text-xs font-semibold truncate ${goal.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'} ${isOwner ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-450' : ''}`}
                                      title={isOwner ? "Click to edit goal" : goal.text}
                                    >
                                      {goal.text}
                                    </span>
                                  </div>
                                  {isOwner && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                                      <button
                                        onClick={() => handleDeleteGoal(goal._id)}
                                        className="p-1 rounded-md text-gray-455 hover:text-red-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-zinc-800 transition-all duration-150"
                                        title="Delete Goal"
                                      >
                                        <FaTrash size={10} />
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Add Goal Input */}
                    {isOwner && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                        <input
                          type="text"
                          value={newGoalText}
                          onChange={e => setNewGoalText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGoalDirect(); } }}
                          placeholder="Add new goal..."
                          className="flex-1 px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <button
                          onClick={handleAddGoalDirect}
                          className={'px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white rounded-lg transition-colors shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Teams Assigned & User Stories Row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                <div className={showUserStories ? 'lg:col-span-3' : 'lg:col-span-6'}>
                  <div className="flex justify-between mb-2 gap-4">
                    <h2 className={'text-xl font-semibold text-gray-900 dark:text-gray-100'}>Teams</h2>
                    {isOwner && (
                      <form onSubmit={(e) => { e.preventDefault(); if (selectedTeam) handleAddTeam(selectedTeam.TeamID); }} className="relative">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className={'border rounded-xl px-3 py-1.5 w-64 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white border-gray-300 text-gray-900 dark:bg-dark-bg dark:border-[#232323] dark:text-gray-100 dark:focus:outline-none dark:focus:ring-blue-500 dark:focus:border-blue-500'}
                            value={teamSearch}
                            onChange={e => {
                              setTeamSearch(e.target.value);
                              setSelectedTeam(null);
                              setShowAllTeams(false);
                            }}
                            onFocus={() => {
                              setIsTeamInputFocused(true);
                              if (!teamSearch) {
                                const assignedIds = new Set(teams.map(t => t.TeamID));
                                const availableTeams = orgTeams.filter(t => !assignedIds.has(t.TeamID));
                                setFilteredAvailableTeams(availableTeams.slice(0, 10));
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setIsTeamInputFocused(false);
                              }, 200);
                            }}
                            placeholder="Search team to add..."
                            autoComplete="off"
                          />
                          {selectedTeam && (
                            <button
                              type="submit"
                              disabled={!selectedTeam}
                              className={'px-4 py-2 text-sm text-white font-semibold rounded-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm dark:bg-blue-600 dark:hover:bg-blue-500'}
                              title={selectedTeam ? 'Add selected team to project' : 'Select a team from dropdown'}
                            >
                              Add
                            </button>
                          )}
                        </div>
                        {isTeamInputFocused && filteredAvailableTeams.length > 0 && (
                          <div className="absolute top-full right-0 z-50 mt-2 w-96 animate-fadeIn">
                            <ul className={'border border-gray-200 rounded-xl bg-white max-h-80 overflow-y-auto shadow-2xl py-1.5 scrollbar-thin dark:bg-dark-bg dark:border-[#232323]'}>
                              {filteredAvailableTeams.map((team, index) => (
                                <li key={`${team.TeamID}-${index}`} className={'px-3 py-1.5 border-b border-gray-100 last:border-b-0 transition-colors duration-150 dark:border-zinc-800/60'}>
                                  <div className="flex items-center justify-between gap-2">
                                    <div
                                      className={'flex-1 cursor-pointer rounded-lg p-2 hover:bg-gray-50 transition-colors duration-150 dark:hover:bg-zinc-800/40'}
                                      onMouseEnter={(e) => {
                                        const el = e.currentTarget;
                                        el.style.backgroundColor = hexToRgba(team.TeamColor, theme === 'dark' ? 0.15 : 0.08) || '';
                                      }}
                                      onMouseLeave={(e) => {
                                        const el = e.currentTarget;
                                        el.style.backgroundColor = '';
                                      }}
                                      onClick={() => {
                                        setSelectedTeam(team);
                                        setTeamSearch(team.TeamName + (team.TeamDescription ? ' (' + team.TeamDescription + ')' : ''));
                                        setIsTeamInputFocused(false);
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs"
                                          style={{
                                            backgroundColor: hexToRgba(team.TeamColor, theme === 'dark' ? 0.18 : 0.12),
                                            color: team.TeamColor || (theme === 'dark' ? '#60A5FA' : '#2563EB')
                                          }}
                                        >
                                          {(team.TeamName || '').split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className={'font-semibold text-gray-900 text-sm truncate dark:text-gray-100'}>
                                            {team.TeamName}
                                          </div>
                                          {team.TeamDescription && (
                                            <div className={'text-xs text-gray-500 truncate mt-0.5 dark:text-gray-400'}>
                                              {team.TeamDescription}
                                            </div>
                                          )}
                                          <div className={'text-xs text-gray-400 mt-0.5 dark:text-gray-500'}>
                                            Members: {Array.isArray(team.teamMembers) ? team.teamMembers.length : (team.memberCount ?? 0)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => { setSelectedTeam(team); handleAddTeam(team.TeamID); }}
                                      className={'ml-1 p-2 rounded-full transition-all duration-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white'}
                                    >
                                      <FaPlus size={12} />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            {!showAllTeams && orgTeams.length > 10 && (
                              <button
                                type="button"
                                onClick={() => setShowAllTeams(true)}
                                className={'w-full mt-2 px-4 py-2.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:bg-emerald-50 rounded-xl transition-colors duration-200 border border-gray-100 bg-white shadow-sm dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-zinc-800/40 dark:bg-[#111113] dark:border-[#232323]'}
                              >
                                Show All Teams ({orgTeams.length})
                              </button>
                            )}
                          </div>
                        )}
                      </form>
                    )}
                  </div>
                  <div>
                    {teams.length === 0 ? (
                      <div className={'text-center py-8 text-gray-400 dark:text-gray-500'}>
                        No teams assigned to this project.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teams.map((team) => {
                          const initials = team.TeamName.length > 0 ? team.TeamName.split(' ').map(n => n[0]).join('') : '';
                          return (
                            <div key={team.TeamID}
                              className={'relative rounded-2xl border border-gray-200/80 p-4 bg-white hover:shadow-md hover:scale-[1.01] transition-all duration-300 dark:border-zinc-800/80 dark:bg-dark-bg hover:bg-gray-50/50 dark:hover:bg-[#232329]/40'}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div
                                    className={'w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 dark:bg-emerald-950/20'}
                                    style={{ backgroundColor: hexToRgba(team.TeamColor, theme === 'dark' ? 0.12 : 0.3) }}>
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <Link href={`/team/${team.TeamID}`} className={`${tableTextClasses} hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer block truncate`} title="View Team Details">
                                      {team?.TeamName || team.TeamID}
                                    </Link>
                                    {team?.TeamDescription && (
                                      <div className={`${tableSecondaryTextClasses} truncate`}>{team.TeamDescription}</div>
                                    )}
                                    <div className={`${tableSecondaryTextClasses} mt-1 text-sm`}>
                                      <span className={'dark:text-white'}>Created: </span> {team.CreatedDate ? new Date(team.CreatedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusPill status={team.IsActive ? 'Active' : 'InActive'} theme={theme} showPulseOnActive />
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                {/* Members overlay */}
                                {team.teamMembers && team.teamMembers.length > 0 && (
                                  <div className='flex items-center'>
                                    <div className="flex -space-x-2">
                                      {team.teamMembers.slice(0, 3).map((member, idx) => (
                                        <div
                                          key={member._id || idx}
                                          className={'w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-medium shadow-sm dark:border-gray-700'}
                                          title={`${member.firstName || ''} ${member.lastName || ''}`.trim()}
                                        >
                                          {member.profileImage ? (
                                            <img src={member.profileImage} alt={(member.firstName || member.lastName || 'Member')} className="w-full h-full object-cover" />
                                          ) : (
                                            <span>{getUserInitials(member)}</span>
                                          )}
                                        </div>
                                      ))}
                                      {team.teamMembers.length > 3 && (
                                        <div className={'w-7 h-7 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300'}
                                        >
                                          +{team.teamMembers.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {isOwner && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setRevokingTeam(team);
                                        setShowRevokeDialog(true);
                                      }}
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${team.IsActive
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-800/50'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50'}`}
                                      title={team.IsActive ? 'Revoke Access' : 'Grant Access'}
                                      disabled={toggling === team.TeamID}
                                    >
                                      {team.IsActive ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRemovingTeam(team);
                                        setShowRemoveDialog(true);
                                      }}
                                      className={'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200 dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'}
                                      title="Remove Team"
                                      disabled={removing}
                                    >
                                      <FiX size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Stories Table */}
                {showUserStories && (
                  <div className="lg:col-span-2">
                    <div className="flex justify-between mb-2">
                      <h2 className={'text-xl font-semibold text-gray-900 dark:text-gray-100'}>User Stories</h2>
                      {!project?.isArchived && (
                        <button
                          onClick={() => openAddTaskModal({
                            mode: 'fromProject',
                            projectIdDefault: projectId,
                            userStories: userStories,
                            addTaskTypeMode: 'userStory',
                            projectMembers: projectMembers,
                            onAddTask: handleAddTask
                          })}
                          className={'flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'}
                        >
                          <FaPlus size={14} />
                          Create
                        </button>
                      )}
                    </div>
                    <div className={`overflow-x-auto overflow-y-auto max-h-[220px] custom-scrollbar ${tableContainerClasses}`}>
                      {userStories.length === 0 ? (
                        <div className={'text-center py-8 text-gray-400 dark:text-gray-500'}>
                          No user stories for this project.
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className={`sticky top-0 z-10 border-b bg-gray-50 border-gray-200 dark:bg-[#111113] dark:border-zinc-800/80`}>
                            <tr className={tableHeaderClasses}>
                              <th className={`py-3 px-4 text-left w-[340px] ${tableHeaderTextClasses}`}>Name</th>
                              <th className={`hidden md:table-cell py-3 px-4 text-left w-[180px] ${tableHeaderTextClasses}`}>Due Date</th>
                              <th className={`py-3 px-4 text-center w-[160px] ${tableHeaderTextClasses}`}>Status</th>
                              <th className={`py-3 px-4 text-center w-[120px] ${tableHeaderTextClasses}`}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userStories.map(story => (
                              <tr key={story._id} className={tableRowClasses}>
                                <td className="py-1.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                      <Link href={`/task/${story.TaskID}`} className={tableTextClasses + ' hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer'} title="View User Story Details">
                                        {story.Name}
                                      </Link>
                                      <div className="flex items-center justify-start gap-1 min-w-0 w-full text-xs mt-0.5">
                                        {(story.TaskNumber || story.TicketNumber) && (
                                          <span className="font-semibold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                                            #{story.TaskNumber || story.TicketNumber}
                                          </span>
                                        )}
                                        {(story.TaskNumber || story.TicketNumber) && story.Description && (
                                          <span className="text-gray-300 dark:text-gray-600 shrink-0">•</span>
                                        )}
                                        {story.Description && (
                                          <span className={`${tableSecondaryTextClasses} truncate block`} title={story.Description}>{story.Description}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className={`hidden md:table-cell py-1.5 px-4 ${tableSecondaryTextClasses}`}>
                                  <span>{formatDateUTC(story.DueDate)}</span>
                                </td>
                                <td className="py-1.5 px-4 text-center">
                                  {getTaskStatusBadge(story.Status, getTaskStatusText(story.Status))}
                                </td>
                                <td className="py-1.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleEditTask(story)}
                                      className={'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-800/50'}
                                      title="Edit User Story"
                                    >
                                      <FiEdit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => confirmDeleteUserStory(story)}
                                      className={'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200 dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'}
                                      title="Delete User Story"
                                    >
                                      <FiTrash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks Table - Keep it full width below */}
              <div className="mb-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={'text-xl font-semibold text-gray-900 dark:text-gray-100'}>Tasks</h2>
                    <div className="flex items-center gap-3">
                      {selectedTasks.length > 0 ? (
                        <>
                          <div className={'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}>
                            <span className="text-sm font-medium">{selectedTasks.length} selected</span>
                            <button
                              onClick={() => setSelectedTasks([])}
                              className={'p-1 hover:bg-emerald-100 rounded-full transition-colors dark:hover:bg-emerald-900/50'}
                            >
                              <FaTimes size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => setShowBulkDeleteDialog(true)}
                            className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'}
                          >
                            <MdDelete size={18} />
                            Delete Selected
                          </button>
                        </>
                      ) : (
                        !project?.isArchived && (
                          <button
                            onClick={() => openAddTaskModal({
                              mode: 'fromProject',
                              projectIdDefault: projectId,
                              parentIdDefault: selectedUserStory !== 'all' ? selectedUserStory : '',
                              userStories: userStories,
                              addTaskTypeMode: 'task',
                              projectMembers: projectMembers,
                              onAddTask: handleAddTask
                            })}
                            className={'flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'}
                          >
                            <FaPlus size={14} />
                            Create
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <div className={`overflow-x-auto overflow-y-auto max-h-[80vh] custom-scrollbar mb-2 ${tableContainerClasses}`}>
                  {taskList.length === 0 ? (
                    <div className={'text-center py-8 text-gray-400 dark:text-gray-500'}>
                      No tasks for this project.
                    </div>
                  ) : (
                    <table className="w-full table-fixed">
                      <thead className={`sticky top-0 z-10 border-b bg-gray-50 border-gray-200 dark:bg-[#111113] dark:border-zinc-800/80`}>
                        <tr className={tableHeaderClasses}>
                          <th className={`hidden sm:table-cell py-3 pl-4 text-center w-[50px] ${tableHeaderTextClasses}`}>
                            <input
                              type="checkbox"
                              checked={selectedTasks.length === taskList.length && taskList.length > 0}
                              onChange={handleSelectAllTasks}
                              className={'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'}
                            />
                          </th>
                          <th className={`py-3 px-4 text-left w-[42%] ${tableHeaderTextClasses}`}>
                            <button type="button" onClick={() => handleTasksSort('name')} className="inline-flex items-center gap-1 w-full text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                              <span>Name</span>
                              {getTasksSortIcon('name')}
                            </button>
                          </th>
                          <th className={`hidden md:table-cell py-3 px-4 text-left w-[12%] ${tableHeaderTextClasses}`}>
                            <button type="button" onClick={() => handleTasksSort('assignedTo')} className="inline-flex items-center gap-1 w-full text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                              <span>Assigned To</span>
                              {getTasksSortIcon('assignedTo')}
                            </button>
                          </th>
                          <th className={`hidden md:table-cell py-3 px-4 text-center w-[11%] ${tableHeaderTextClasses}`}>
                            <button type="button" onClick={() => handleTasksSort('assignedDate')} className="inline-flex items-center justify-center gap-1 w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                              <span>Assigned On</span>
                              {getTasksSortIcon('assignedDate')}
                            </button>
                          </th>
                          <th className={`hidden md:table-cell py-3 px-4 text-center w-[11%] ${tableHeaderTextClasses}`}>
                            <button type="button" onClick={() => handleTasksSort('dueDate')} className="inline-flex items-center justify-center gap-1 w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                              <span>Due Date</span>
                              {getTasksSortIcon('dueDate')}
                            </button>
                          </th>
                          <th className={`hidden md:table-cell py-3 px-4 text-left w-[8%] ${tableHeaderTextClasses}`}>
                            <button type="button" onClick={() => handleTasksSort('priority')} className="inline-flex items-center justify-center gap-1 w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                              <span>Priority</span>
                              {getTasksSortIcon('priority')}
                            </button>
                          </th>
                          <th className={`py-3 px-4 text-center w-[9%] ${tableHeaderTextClasses}`}>
                            <button type="button" onClick={() => handleTasksSort('status')} className="inline-flex items-center justify-center gap-1 w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                              <span>Status</span>
                              {getTasksSortIcon('status')}
                            </button>
                          </th>
                          <th className={`hidden sm:table-cell py-3 px-4 text-center w-[7%] ${tableHeaderTextClasses}`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasksSorted.map(task => {
                          const ticketRowClasses = task.Type === 'Support'
                            ? `${tableRowClasses} bg-red-50 dark:bg-red-900/10`
                            : tableRowClasses;

                          return (
                            <tr key={task._id} className={ticketRowClasses}>
                              <td className="hidden sm:table-cell py-3 pl-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedTasks.includes(task.TaskID)}
                                  onChange={() => handleSelectTask(task.TaskID)}
                                  className={'w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-emerald-600'}
                                />
                              </td>
                              <td className="py-3 px-4 overflow-hidden">
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2 mb-1 w-full min-w-0">
                                    <button
                                      onClick={() => router.push(`/task/${task.TaskID}`)}
                                      className={'text-left hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer font-medium truncate block max-w-full dark:hover:text-blue-400'}
                                      title={task.Name}
                                    >
                                      {task.Name && task.Name.length > 100 ? `${task.Name.substring(0, 100)}...` : task.Name}
                                    </button>
                                    {getTaskTypeBadgeComponent(task.Type)}
                                  </div>
                                  <div className="flex items-center justify-start gap-1 min-w-0 w-full text-xs">
                                    {(task.TaskNumber || task.TicketNumber) && (
                                      <span className="font-semibold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                                        #{task.TaskNumber || task.TicketNumber}
                                      </span>
                                    )}
                                    {(task.TaskNumber || task.TicketNumber) && task.Description && (
                                      <span className="text-gray-300 dark:text-gray-600 shrink-0">•</span>
                                    )}
                                    <span className={'text-gray-500 truncate block dark:text-gray-400'} title={task.Description}>{task.Description}</span>
                                  </div>
                                  {/* Show assigned to on mobile if available */}
                                  {task.AssignedTo && task.AssignedToDetails && (
                                    <div className={'md:hidden mt-1 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300'}>
                                      <span>{task.AssignedToDetails.fullName.split(' ')[0]}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="hidden md:table-cell py-3 px-4">
                                {task.AssignedTo && task.AssignedToDetails ? (
                                  <div className="flex items-center gap-3">
                                    <div className={'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm dark:from-blue-600 dark:to-blue-700'}>
                                      {task.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={tableTextClasses}>{task.AssignedToDetails.fullName.split(' ')[0]} <span className={'text-xs'}>{isMe(task.AssignedTo) ? ' (You)' : ''}</span></span>
                                      {task.AssignedToDetails.teamName && (
                                        <span className={`text-xs ${tableSecondaryTextClasses}`}>{task.AssignedToDetails.teamName}</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <span className={tableSecondaryTextClasses}>Not Assigned</span>
                                  </div>
                                )}
                              </td>
                              <td className={`hidden md:table-cell py-3 px-4 text-center ${tableSecondaryTextClasses}`}>
                                {task.AssignedDate ? (
                                  <div className="flex flex-col items-center leading-tight text-sm">
                                    <span>{new Date(task.AssignedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    <span className={'text-xs text-gray-500 text-xs text-gray-400'}>
                                      {new Date(task.AssignedDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </span>
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className={`hidden md:table-cell py-3 px-4 text-center ${tableSecondaryTextClasses}`}>
                                <span>{formatDateUTC(task.DueDate)}</span>
                              </td>
                              <td className="hidden md:table-cell py-3 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  {task.Type !== 'User Story' && getPriorityBadge(task.Priority)}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getTaskStatusBadge(task.Status, getTaskStatusText(task.Status))}
                              </td>
                              <td className="hidden sm:table-cell py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditTask(task)}
                                    className={'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-800/50'}
                                    title="Edit Task"
                                  >
                                    <FiEdit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => confirmDeleteTask(task)}
                                    className={'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200 dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'}
                                    title="Delete Task"
                                    disabled={removing}
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              {/* Project Activity Timeline - moved below Tasks Table */}
              {projectActivity.length > 0 && (
                <div className="mb-8">
                  <ProjectActivity
                    projectId={projectId}
                    activity={projectActivity}
                    projectCreatedDate={project?.CreatedDate}
                    hasMore={hasMoreActivities}
                    onLoadMore={handleLoadMoreActivities}
                    loadingMore={loadingMoreActivities}
                  />
                </div>
              )}
            </div>
          ) : activeTab === 'board' ? (
            <div>
              {/* Board Tab: Re-using global Kanban board */}
              <KanbanBoard projectId={projectId} selectedUserStoryProp={selectedUserStory} projectMembersProp={projectMembers} taskListProp={taskList} />
            </div>
          ) : activeTab === 'timeline' ? (
            <GanttChart tasks={taskList} userStories={userStories} project={project} onUpdateTask={handleUpdateTask} onEditTask={handleEditTask} />
          ) : activeTab === 'files' ? (
            <ProjectFilesTab projectId={projectId} />
          ) : activeTab === 'list' ? (
            <ProjectListView taskList={taskList} togglingSubtasks={togglingSubtasks} onSubtaskToggle={handleSubtaskToggle} onDeleteTask={confirmDeleteTask} />
          ) : activeTab === 'knowledge' ? (
            <RAGManagement organizationId={project?.OrganizationID} canSync={isOwner} />
          ) : activeTab === 'reports' ? (
            <ReportGenerator projectId={projectId} projectName={project?.Name} inline={true} canGenerate={isOwner} />
          ) : activeTab === 'releases' && isOwner ? (
            <ReleaseSummaryGenerator projectId={projectId} projectName={project?.Name}
              theme={theme}
            />
          ) : null}
        </div>

        {showSettingsModal && (
          <div className="fixed inset-0 z-40">
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isModalClosing ? 'opacity-0' : isModalOpening ? 'opacity-0' : 'opacity-100'}`}
              onClick={handleCloseModal}
            />
            <div className={`absolute right-0 top-16 bottom-0 w-full lg:max-w-xl bg-white text-gray-900 dark:bg-dark-bg dark:text-white border-l border-gray-200 dark:border-[#232323] p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isModalClosing ? 'translate-x-full' : isModalOpening ? 'translate-x-full' : 'translate-x-0'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={"text-xl font-semibold text-gray-900 text-xl font-semibold text-white"}>{settingsForm.Name}</h3>
                <button
                  onClick={handleCloseModal}
                  className={"text-gray-400 hover:text-gray-600 text-2xl font-bold text-gray-400 hover:text-gray-300 text-2xl font-bold"}
                >
                  ×
                </button>
              </div>
              {project.ModifiedDate && (
                <div className={"text-sm text-gray-500 mb-4 flex items-center gap-1 text-sm text-white mb-4 flex items-center gap-1"}>
                  <FaInfoCircle size={14} />
                  <span>Last Modified: {new Date(project.ModifiedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
              <form onSubmit={handleSettingsSave} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <FaProjectDiagram className="text-gray-500 dark:text-white" size={16} />
                    <label className="text-sm font-medium text-gray-700 dark:text-white">Name</label>
                  </div>
                  <input
                    type="text"
                    value={settingsForm.Name}
                    onChange={e => setSettingsForm(f => ({ ...f, Name: e.target.value }))}
                    className="flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 dark:border-gray-600 focus:border-gray-200 dark:focus:border-gray-600 focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    maxLength={50}
                    required
                    placeholder="Enter project name"
                  />
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 min-w-[120px] pt-2">
                    <FaAlignLeft className="text-gray-500 dark:text-white" size={16} />
                    <label className="text-sm font-medium text-gray-700 dark:text-white">Description</label>
                  </div>
                  <textarea
                    value={settingsForm.Description}
                    onChange={e => setSettingsForm(f => ({ ...f, Description: e.target.value }))}
                    className="flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 dark:border-gray-600 focus:border-gray-200 dark:focus:border-gray-600 focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                    rows={5}
                    placeholder="Enter project description"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <FaCalendarAlt className="text-gray-500 dark:text-white" size={16} />
                    <label className="text-sm font-medium text-gray-700 dark:text-white">Due Date</label>
                  </div>
                  <input
                    type="date"
                    value={settingsForm.DueDate}
                    onChange={e => setSettingsForm(f => ({ ...f, DueDate: e.target.value }))}
                    className="flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 dark:border-gray-600 focus:border-gray-200 dark:focus:border-gray-600 focus:outline-none bg-transparent text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <FaTag className="text-gray-500 dark:text-white" size={16} />
                    <label className="text-sm font-medium text-gray-700 dark:text-white">Status</label>
                  </div>
                  <div className="flex-1 relative">
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(open => !open)}
                      className="w-full px-0 py-2 border-0 border-b-2 border-gray-200 dark:border-gray-600 focus:border-gray-200 dark:focus:border-gray-600 focus:outline-none bg-transparent text-gray-900 dark:text-white flex items-center gap-2"
                    >
                      {getProjectStatusBadge(getProjectStatus(settingsForm.ProjectStatusID), false)}
                      <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showStatusDropdown && (
                      <div className={`absolute z-50 w-full mt-1 border rounded-xl shadow-lg bg-white border-gray-200 dark:bg-dark-bg dark:border-gray-600`}>
                        {[1, 2, 3, 4, 5, 6].map(statusCode => {
                          const status = getProjectStatus(statusCode);
                          return (
                            <button
                              key={status.Code}
                              type="button"
                              onClick={() => {
                                setSettingsForm(f => ({ ...f, ProjectStatusID: status.Code }));
                                setShowStatusDropdown(false);
                              }}
                              className={`w-full px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-2 text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
                            >
                              {getProjectStatusBadge(status, false)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Custom Dropdown */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <FaSignal className={"text-gray-500 text-gray-400"} size={16} />
                    <label className={"text-sm font-medium text-gray-700 text-sm font-medium text-gray-300"}>
                      Priority
                    </label>
                  </div>
                  <div className="flex-1">
                    <CustomDropdown
                      value={settingsForm.Priority}
                      onChange={(val) => setSettingsForm(f => ({ ...f, Priority: Number(val) }))}
                      disabled={!isOwner}
                      options={projectPriorityOptions}
                      placeholder="Select Priority"
                      variant="outlined"
                      renderOption={(option) => (
                        <div className="flex items-center gap-2 py-0.5">
                          <ProjectPriorityBadge priority={option.value} />
                          <span className="font-medium text-sm">{option.label}</span>
                        </div>
                      )}
                      renderSelected={(option) => (
                        <div className="flex items-center gap-2">
                          <ProjectPriorityBadge priority={option ? option.value : settingsForm.Priority} showLabel={true} />
                        </div>
                      )}
                    />
                  </div>
                </div>

                {!isOwner && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
                    <FaInfoCircle size={14} className="text-amber-500 flex-shrink-0" />
                    <span>Only the project owner can edit project properties and settings.</span>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 dark:text-gray-300 dark:hover:bg-[#424242] dark:border-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
                    disabled={savingSettings}
                  >
                    {savingSettings ? (
                      <span className="flex items-center gap-2">
                        <FaSpinner className="animate-spin" size={14} />
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>

              {/* Danger Zone */}
              {project && userDetails && project.ProjectOwner === userDetails._id && (
                <div className={`mt-8 pt-6 border-t border-gray-200 dark:border-gray-800`}>
                  <h4 className="text-sm font-semibold text-red-500 mb-2">Danger Zone</h4>
                  <p className={`text-xs mb-4 text-gray-500 dark:text-gray-400`}>
                    Once you delete a project, there is no going back. All tasks, teams, and data associated with this project will be permanently deleted.
                  </p>
                  {project.isArchived ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleUnarchiveProject}
                        disabled={archivingProject}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        {archivingProject ? (
                          <>
                            <FaSpinner className="animate-spin" size={12} />
                            Unarchiving...
                          </>
                        ) : (
                          'Unarchive Project'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseModal();
                          setConfirmProjectName('');
                          setDeleteReason('');
                          setActiveDeleteTab('delete');
                          setTimeout(() => {
                            setShowDeleteProjectConfirm(true);
                          }, 350);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Delete Project
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseModal();
                        setConfirmProjectName('');
                        setDeleteReason('');
                        setActiveDeleteTab('archive');
                        setTimeout(() => {
                          setShowDeleteProjectConfirm(true);
                        }, 350);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Delete Project
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <CustomModal
          isOpen={showDeleteProjectConfirm}
          onClose={() => {
            setShowDeleteProjectConfirm(false);
            setConfirmProjectName('');
            setDeleteReason('');
            setActiveDeleteTab(project?.isArchived ? 'delete' : 'archive');
          }}
          title={project?.isArchived ? "Delete Project" : "Archive or Delete Project"}
          theme={theme}
          maxWidthClass="max-w-md"
        >
          <div>
            {/* Tabs */}
            {!project?.isArchived && (
              <div className={`flex space-x-1 mb-6 bg-gray-100 p-1 dark:bg-[#121214] dark:p-1 dark:border dark:border-zinc-800 rounded-xl transition-all duration-300`}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDeleteTab('archive');
                    setConfirmProjectName('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all duration-300 ${activeDeleteTab === 'archive'
                    ? 'bg-white text-blue-600 shadow-md dark:bg-zinc-800 dark:text-white dark:shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                >
                  📦 Archive Project
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeleteTab('delete')}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all duration-300 ${activeDeleteTab === 'delete'
                    ? 'bg-white text-red-600 shadow-md dark:bg-zinc-800 dark:text-white dark:shadow-sm dark:border dark:border-zinc-750'
                    : 'text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                >
                  ⚠️ Delete Permanently
                </button>
              </div>
            )}

            {/* Tab Contents */}
            {activeDeleteTab === 'archive' ? (
              <div className="h-[260px] flex flex-col justify-between">
                <div className="space-y-3 text-xs">
                  <p className="text-gray-700 dark:text-gray-300">
                    Marking this project as archived performs the following:
                  </p>
                  <ul className="space-y-2 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">🔒</span>
                      <span className="text-gray-600 dark:text-gray-450">Immediately hides the project from all team members.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">👑</span>
                      <span className="text-gray-600 dark:text-gray-450">Only you (the Project Owner) can view and access it.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">💾</span>
                      <span className="text-gray-600 dark:text-gray-450">All task history, files, and configurations are securely preserved.</span>
                    </li>
                  </ul>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteProjectConfirm(false);
                      setConfirmProjectName('');
                      setDeleteReason('');
                      setActiveDeleteTab('archive');
                    }}
                    className={"px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-xs font-semibold transition-all px-4 py-2 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 text-xs font-semibold transition-all"}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleArchiveProject}
                    disabled={archivingProject}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {archivingProject ? (
                      <>
                        <FaSpinner className="animate-spin" size={12} />
                        Archiving...
                      </>
                    ) : (
                      'Yes, Archive Project'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-[260px] flex flex-col justify-between">
                <div className="space-y-3">
                  <p className={`text-xs text-gray-600 dark:text-gray-300 leading-relaxed`}>
                    Are you sure you want to permanently delete the project <strong className="text-red-500">{project?.Name}</strong>? All tasks, teams, and data associated with this project will be deleted. This is irreversible.
                  </p>

                  <div>
                    <label className={`block text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 mb-1`}>
                      Type <strong className="text-red-500">{project?.Name}</strong> to confirm
                    </label>
                    <input
                      type="text"
                      value={confirmProjectName}
                      onChange={e => setConfirmProjectName(e.target.value)}
                      className={"w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:border-red-500 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 text-xs transition-all w-full px-3 py-1.5 rounded-xl border border-gray-700 focus:border-red-500 focus:outline-none bg-transparent text-white placeholder-gray-500 text-xs transition-all"}
                      placeholder="Enter project name"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                      Reason for deletion (will be emailed to the owner):
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={e => setDeleteReason(e.target.value)}
                      className={"w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:border-red-500 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 text-xs transition-all resize-none w-full px-3 py-1.5 rounded-xl border border-gray-700 focus:border-red-500 focus:outline-none bg-transparent text-white placeholder-gray-500 text-xs transition-all resize-none"}
                      rows={2}
                      placeholder="e.g. Project completed, archiving old workspace..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteProjectConfirm(false);
                      setConfirmProjectName('');
                      setDeleteReason('');
                      setActiveDeleteTab('archive');
                    }}
                    className={"px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-xs font-semibold transition-all px-4 py-2 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 text-xs font-semibold transition-all"}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={deletingProject || confirmProjectName !== project?.Name}
                    className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 ${confirmProjectName === project?.Name
                      ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                      : "bg-red-600/50 text-white/70 cursor-not-allowed"
                      }`}
                  >
                    {deletingProject ? (
                      <>
                        <FaSpinner className="animate-spin" size={12} />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </CustomModal>
        {/* Remove Team Confirmation Dialog */}
        {showRemoveDialog && removingTeam && (
          <CustomModal
            isOpen={showRemoveDialog}
            onClose={() => {
              setShowRemoveDialog(false);
              setRemovingTeam(null);
            }}
            title="Remove Team"
            actions={
              <>
                <button
                  onClick={() => {
                    setShowRemoveDialog(false);
                    setRemovingTeam(null);
                  }}
                  className={'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 dark:text-gray-400 dark:hover:bg-dark-hover'}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveTeam(removingTeam.TeamID)}
                  className={'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'}
                  disabled={removing}
                >
                  {removing ? 'Removing...' : 'Remove'}
                </button>
              </>
            }
          >
            <p className={'text-gray-600 dark:text-gray-400'}>
              Are you sure you want to remove {orgTeams.find(t => t.TeamID === removingTeam.TeamID)?.TeamName || removingTeam.TeamID} from this project? This action cannot be undone.
            </p>
          </CustomModal>
        )}
        {/* Revoke Access Confirmation Dialog */}
        {showRevokeDialog && revokingTeam && (
          <CustomModal
            isOpen={showRevokeDialog}
            onClose={() => {
              setShowRevokeDialog(false);
              setRevokingTeam(null);
            }}
            title={revokingTeam.IsActive ? 'Revoke Access' : 'Grant Access'}
            actions={
              <>
                <button
                  onClick={() => {
                    setShowRevokeDialog(false);
                    setRevokingTeam(null);
                  }}
                  className={'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 dark:text-gray-400 dark:hover:bg-dark-hover'}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleToggleTeamStatus(revokingTeam.TeamID)}
                  className={`px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 ${revokingTeam.IsActive
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    } dark:${revokingTeam.IsActive
                      ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                      : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'
                    }`}
                  disabled={toggling === revokingTeam.TeamID}
                >
                  {toggling === revokingTeam.TeamID ? 'Updating...' : 'Confirm'}
                </button>
              </>
            }
          >
            <p className={'text-gray-600 dark:text-gray-400'}>
              {revokingTeam.IsActive
                ? `Are you sure you want to revoke access for ${orgTeams.find(t => t.TeamID === revokingTeam.TeamID)?.TeamName || revokingTeam.TeamID}? This will make the team inactive for this project.`
                : `Are you sure you want to grant access for ${orgTeams.find(t => t.TeamID === revokingTeam.TeamID)?.TeamName || revokingTeam.TeamID}? This will make the team active for this project.`
              }
            </p>
          </CustomModal>
        )}

        {/* Delete Task Confirmation Dialog */}
        {showDeleteTaskDialog && taskToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={"bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700"}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className={"text-lg font-semibold text-gray-900 dark:text-gray-100"}>
                  Delete Task
                </h3>
              </div>
              <div className="mb-6">
                <p className={"text-gray-600 mb-4 dark:text-gray-300"}>
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
                <div className={"bg-red-50 border border-red-100 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800"}>
                  <h4 className={"font-medium text-red-800 mb-1 dark:text-red-300"}>{taskToDelete.Name}</h4>
                  <p className={"text-sm text-red-700 dark:text-red-400"}>{taskToDelete.Description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {getTaskTypeBadgeComponent(taskToDelete.Type)}
                    <span className={"text-xs text-red-600 dark:text-red-400"}>
                      {getTaskStatusText(taskToDelete.Status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteTaskDialog(false);
                    setTaskToDelete(null);
                  }}
                  className={"px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 dark:text-gray-300 dark:hover:bg-dark-hover dark:border-gray-600"}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTask(taskToDelete.TaskID)}
                  className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center gap-2"
                  disabled={deletingTask}
                >
                  {deletingTask ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <MdDelete size={18} />
                      <span>Delete Task</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Bulk Delete Tasks Confirmation Dialog */}
        {showBulkDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={"bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700"}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className={"text-lg font-semibold text-gray-900 dark:text-gray-100"}>
                  Delete Selected Tasks
                </h3>
              </div>
              <div className="mb-6">
                <p className={"text-gray-600 mb-4 dark:text-gray-300"}>
                  Are you sure you want to delete {selectedTasks.length} selected task{selectedTasks.length !== 1 ? 's' : ''}? This action cannot be undone.
                </p>
                <div className={"bg-red-50 border border-red-100 rounded-lg p-4 max-h-32 overflow-y-auto dark:bg-red-900/20 dark:border-red-800"}>
                  <h4 className={"font-medium text-red-800 mb-2 dark:text-red-300"}>Tasks to be deleted:</h4>
                  {taskList
                    .filter(task => selectedTasks.includes(task.TaskID))
                    .slice(0, 5)
                    .map(task => (
                      <div key={task.TaskID} className={"text-sm text-red-700 mb-1 dark:text-red-400"}>
                        • {task.Name}
                      </div>
                    ))}
                  {selectedTasks.length > 5 && (
                    <div className={"text-sm text-red-600 italic dark:text-red-400"}>
                      ... and {selectedTasks.length - 5} more
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowBulkDeleteDialog(false);
                  }}
                  className={"px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 dark:text-gray-300 dark:hover:bg-dark-hover dark:border-gray-600"}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteTasks}
                  className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center gap-2"
                  disabled={bulkDeleting}
                >
                  {bulkDeleting ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <MdDelete size={18} />
                      <span>Delete Tasks</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete User Story Confirmation Dialog */}
        <CustomModal
          isOpen={showDeleteUserStoryDialog}
          onClose={() => {
            setShowDeleteUserStoryDialog(false);
            setUserStoryToDelete(null);
          }}
          title="Delete User Story"
          actions={
            <>
              <button
                onClick={() => {
                  setShowDeleteUserStoryDialog(false);
                  setUserStoryToDelete(null);
                }}
                className={'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 dark:text-gray-300 dark:hover:bg-dark-hover dark:border-gray-600'}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUserStory(userStoryToDelete?.TaskID)}
                className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center gap-2"
                disabled={deletingUserStory}
              >
                {deletingUserStory ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <MdDelete size={18} />
                    <span>Delete User Story</span>
                  </>
                )}
              </button>
            </>
          }
        >
          <div>
            <p className={'text-gray-600 mb-4 dark:text-gray-300'}>
              Are you sure you want to delete this user story? This action cannot be undone.
            </p>
            {userStoryToDelete && (
              <div className={'bg-red-50 border border-red-100 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800'}>
                <h4 className={'font-medium text-red-800 mb-1 dark:text-red-300'}>
                  {userStoryToDelete.Name}
                </h4>
                <p className={'text-sm text-red-700 dark:text-red-400'}>
                  {userStoryToDelete.Description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {getTaskTypeBadgeComponent(userStoryToDelete.Type)}
                  <span className={'text-xs text-red-600 dark:text-red-400'}>
                    {getTaskStatusText(userStoryToDelete.Status)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CustomModal>


        {/* GitHub Repository Management Modal */}
        {showRepositoryModal && projectRepository && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`max-w-md w-full mx-4 rounded-xl shadow-lg bg-white dark:bg-gray-800`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-medium text-gray-900 dark:text-white`}>
                    Repository Settings
                  </h3>
                  <button
                    onClick={() => setShowRepositoryModal(false)}
                    className={`p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-900 text-gray-900 dark:hover:bg-white dark:text-white`}
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                <div className={`p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FaGithub className="text-green-600" size={20} />
                    <div>
                      <h4 className={`font-semibold text-gray-900 dark:text-white`}>
                        {projectRepository.repositoryFullName}
                      </h4>
                      {projectRepository.repositoryDescription && (
                        <p className={`text-sm text-gray-600 dark:text-gray-300`}>
                          {projectRepository.repositoryDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    {projectRepository.repositoryLanguage && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300`}>
                        <FaCode size={10} />
                        {projectRepository.repositoryLanguage}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-600/20 dark:text-yellow-400`}>
                      <FaStar size={10} />
                      {projectRepository.repositoryStars}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400`}>
                      <FaCodeBranch size={10} />
                      {projectRepository.repositoryForks}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={projectRepository.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white`}
                    >
                      <FaLink size={14} />
                      View Repository
                    </a>
                    <button
                      onClick={handleUnlinkRepository}
                      disabled={unlinkingRepository}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white`}
                    >
                      {unlinkingRepository ? <FaSpinner className="animate-spin" size={14} /> : <FaUnlink size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div >

    </>
  );
}

export default ProjectDetailsPage;