import React, { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import StatusPill from '../../components/shared/StatusPill';
import api, { authService, taskService, githubService, projectService } from '../../services/api';
import { FaCheck, FaExternalLinkAlt, FaEdit, FaTimes, FaSpinner, FaCode, FaQuestionCircle, FaInfoCircle, FaProjectDiagram, FaChartBar, FaToggleOn, FaPlus, FaGithub, FaLink, FaUnlink, FaStar, FaCodeBranch, FaFile, FaAlignLeft, FaCalendarAlt, FaTag, FaFileAlt, FaRobot, FaSort, FaSortUp, FaSortDown, FaList, FaPaperPlane, FaTrash, FaCog, FaClock } from 'react-icons/fa';
import { FiCornerDownRight } from "react-icons/fi";
import { MdDelete } from 'react-icons/md';
import { FaTimeline } from "react-icons/fa6";
import AddTaskModal from '../../components/shared/AddTaskModal';
import CustomModal from '../../components/shared/CustomModal';
import CustomDropdown from '../../components/shared/CustomDropdown';
import { useToast } from '../../context/ToastContext';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import KanbanBoard from '../kanban';
import { getProjectStatusBadge, getProjectStatusStyle } from '../../components/project/ProjectStatusBadge';
import { getPriorityBadge, getTaskStatusBadge, getTaskStatusStyle } from '../../components/task/TaskTypeBadge';
import ProjectDetailsSkeleton from '../../components/skeletons/ProjectDetailsSkeleton';
import ProjectFilesTab from '../../components/project/ProjectFilesTab';
import ProjectActivity from '../../components/project/ProjectActivity';
import GanttChart from '../../components/project/GanttChart';
import ReportGenerator from '../../components/reports/ReportGenerator';
import RAGManagement from '../../components/rag/RAGManagement';
import ReleaseSummaryGenerator from '../../components/project/ReleaseSummaryGenerator';
import { connectSocket, subscribe, getSocket } from '../../services/socket';
import { useThemeClasses } from '../../components/shared/hooks/useThemeClasses';
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
    setProjects
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
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskTypeMode, setAddTaskTypeMode] = useState('task'); // 'userStory' or 'task'
  const [taskList, setTaskList] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [deletingTask, setDeletingTask] = useState(false);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
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
  const [hasMoreActivities, setHasMoreActivities] = useState(false);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);

  // Sorting state for Tasks table
  const [tasksSortKey, setTasksSortKey] = useState('assignedDate'); // name | assignedTo | assignedDate | priority | status
  const [tasksSortDir, setTasksSortDir] = useState('desc'); // asc | desc

  const getThemeClasses = useThemeClasses();

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
      dedupingInterval: 5000,
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
          className={getThemeClasses(
            "px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
            currentPage === 1 || loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-transparent dark:text-gray-500 dark:border-gray-700"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800/40 dark:border-gray-700"
          )}
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
            disabled={page === '...' || loading}
            className={getThemeClasses(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              page === '...'
                ? "text-gray-400 cursor-default dark:text-gray-500"
                : page === currentPage
                  ? "bg-blue-600 text-white dark:bg-blue-600 dark:text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800/40 dark:border-gray-700"
            )}
          >
            {page}
          </button>
        ))}

        <button
          onClick={onNext}
          disabled={currentPage === totalPages || loading}
          className={getThemeClasses(
            "px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
            currentPage === totalPages || loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-transparent dark:text-gray-500 dark:border-gray-700"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800/40 dark:border-gray-700"
          )}
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

  useEffect(() => {
    if (project) {
      setSettingsForm({
        Name: project.Name || '',
        Description: project.Description || '',
        DueDate: project.DueDate ? new Date(project.DueDate).toISOString().slice(0, 10) : '',
        ProjectStatusID: project.ProjectStatusID || 1
      });
    }
  }, [project]);

  const isOwner = userDetails && project && userDetails._id === project.ProjectOwner;

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
      await api.patch(`/project-details/${projectId}/team/${teamId}/toggle`);
      if (res.data.success) {
        setTeams(prev => prev.filter(team => team.TeamID !== teamId));
        setProjectMembers(res.data.projectMembers);
        showToast('Team access updated successfully', 'success');
      }
      else {
        setError(res.data.error);
      }
      setShowRevokeDialog(false);
      setRevokingTeam(null);
      showToast('Team access updated successfully', 'success');
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
        ModifiedDate: new Date()
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
  const tableContainerClasses = getThemeClasses(
    'rounded-xl border border-gray-200',
    'dark:border-gray-700'
  );

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
    setEditingTask(task);
    setAddTaskTypeMode(task?.Type === 'User Story' ? 'userStory' : 'task');
    setIsAddTaskOpen(true);
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
    if (tasksSortKey !== key) return <FaSort className={getThemeClasses('text-gray-400', 'text-gray-500')} size={12} />;
    return tasksSortDir === 'asc'
      ? <FaSortUp className={getThemeClasses('text-blue-600', 'text-blue-400')} size={12} />
      : <FaSortDown className={getThemeClasses('text-blue-600', 'text-blue-400')} size={12} />;
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
        <div className="mb-6">
          <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="-mb-px flex items-center justify-between">
              <div className="flex-1 overflow-x-auto">
                <nav className="flex space-x-8 min-w-max">
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
                    <span>Manage Project</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('board')}
                    className={`${activeTab === 'board'
                      ? theme === 'dark'
                        ? 'border-blue-400 text-blue-400'
                        : 'border-blue-600 text-blue-600'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                  >
                    <FaChartBar size={16} />
                    <span>Board</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`${activeTab === 'timeline'
                      ? theme === 'dark'
                        ? 'border-blue-400 text-blue-400'
                        : 'border-blue-600 text-blue-600'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                  >
                    <FaTimeline size={16} />
                    <span>Timeline</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`${activeTab === 'list'
                      ? theme === 'dark'
                        ? 'border-blue-400 text-blue-400'
                        : 'border-blue-600 text-blue-600'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                  >
                    <FaList size={16} />
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('files')}
                    className={`${activeTab === 'files'
                      ? theme === 'dark'
                        ? 'border-blue-400 text-blue-400'
                        : 'border-blue-600 text-blue-600'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                  >
                    <FaFile size={16} />
                    <span>Files</span>
                  </button>


                  {userDetails?.role === 'Admin' && (
                    <button
                      onClick={() => setActiveTab('knowledge')}
                      className={`${activeTab === 'knowledge'
                        ? theme === 'dark'
                          ? 'border-blue-400 text-blue-400'
                          : 'border-blue-600 text-blue-600'
                        : theme === 'dark'
                          ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                    >
                      <FaRobot size={16} />
                      <span>Knowledge Base</span>
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setActiveTab('reports')}
                      className={`${activeTab === 'reports'
                        ? theme === 'dark'
                          ? 'border-blue-400 text-blue-400'
                          : 'border-blue-600 text-blue-600'
                        : theme === 'dark'
                          ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                    >
                      <FaFileAlt size={16} />
                      <span>Generate Report</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('releases')}
                    className={`${activeTab === 'releases'
                      ? theme === 'dark'
                        ? 'border-blue-400 text-blue-400'
                        : 'border-blue-600 text-blue-600'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                  >
                    <FaPaperPlane size={16} />
                    <span>Releases</span>
                  </button>
                </nav>
              </div>
              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                {activeTab === 'board' && (
                  <div className="py-2">
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
                  </div>
                )}
                {isOwner && (
                  <>
                    <div className="py-2">
                      <button
                        className={getThemeClasses(
                          "flex items-center gap-2 p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors",
                          "dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                        )}
                        title="Project Settings"
                        onClick={handleOpenModal}
                      >
                        <FaCog size={18} />
                        {/* Settings */}
                      </button>
                    </div>
                  </>

                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'manage' ? (
          <div>
            {/* Split Top Layout: Details (Left) & KPI Progress Stats (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
              {/* Left Column: Project Details Card */}
              <div className="lg:col-span-3">
                <div className={getThemeClasses(
                  "h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4",
                  "dark:bg-[#1e1e24] dark:border-gray-800 dark:shadow-none"
                )}>
                  <div>
                    {/* Top Row: Statuses */}
                    <div className="flex items-center justify-between mb-4">
                      {/* Left: Project Status */}
                      <div>
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
                      </div>

                      {/* Right: Deadline Status */}
                      {project.DueDate && (
                        <div>
                          {(() => {
                            const status = getDeadlineStatusComponent(deadline);
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                                <FaClock size={12} className={status.textColor} />
                                {status.text}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Middle Row: Name & Description */}
                    <div className="space-y-2">
                      <h1 className={getThemeClasses(
                        "text-2xl font-bold tracking-tight text-gray-900",
                        "dark:text-white"
                      )}>
                        {project.Name}
                      </h1>
                      {project.Description ? (
                        <p className={getThemeClasses(
                          "text-sm text-gray-600 leading-relaxed max-w-4xl",
                          "dark:text-gray-300"
                        )}>
                          {project.Description}
                        </p>
                      ) : (
                        <p className={getThemeClasses(
                          "text-sm text-gray-400 italic",
                          "dark:text-gray-500"
                        )}>
                          No description provided.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Members & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 mt-6 border-t border-gray-200 dark:border-gray-800">
                    {/* Left: Project Members Avatars */}
                    {projectMembers.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {projectMembers.slice(0, 4).map((member, idx) => (
                            <div
                              key={member._id}
                              className={getThemeClasses(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden bg-gradient-to-r from-purple-500 to-purple-700",
                                "dark:border-[#1e1e24]"
                              )}
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
                            <div className={getThemeClasses(
                              "w-8 h-8 flex items-center justify-center px-2 py-1 rounded-full bg-gray-100 border border-gray-200 shadow-sm",
                              "dark:bg-gray-700 dark:border-gray-600"
                            )}
                              style={{ marginLeft: '-8px' }}>
                              <span className={getThemeClasses(
                                "text-xs font-semibold text-gray-600",
                                "dark:text-gray-300"
                              )}>
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
                          className={getThemeClasses(
                            "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm",
                            "dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                          )}
                        >
                          Edit Project
                        </button>
                      )}

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          showToast('Project link copied to clipboard!', 'success');
                        }}
                        className={getThemeClasses(
                          "px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm",
                          "dark:bg-blue-600 dark:hover:bg-blue-700"
                        )}
                      >
                        Share Project
                      </button>


                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Project KPI & Progress Stats Card */}
              <div>
                <div className={getThemeClasses(
                  "h-full flex flex-col bg-transparent",
                  "dark:border-gray-800 dark:shadow-none"
                )}>
                  <h2 className={getThemeClasses('text-xl font-semibold text-gray-900 mb-4', 'dark:text-gray-100')}>Progress</h2>
                  <div className="h-full border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm ">
                    {/* Progress Circle & Text */}
                    <div className="flex items-center gap-5 ">
                      {(() => {
                        const totalTasksCount = taskList.length;
                        const completedTasksCount = taskList.filter(t => t.Status === 6).length;
                        const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
                        const radius = 28;
                        const strokeWidth = 6;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

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
                          <>
                            <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r={radius} className="text-gray-150 dark:text-gray-800" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" />
                                <circle cx="32" cy="32" r={radius} className="text-blue-600 dark:text-blue-500" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                              </svg>
                              <span className={getThemeClasses(
                                "absolute text-xs font-bold text-gray-800",
                                "absolute text-xs font-bold text-white"
                              )}>
                                {progressPercent}%
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${healthColor}`}>
                                {healthText}
                              </span>
                              <p className={getThemeClasses("text-xs text-gray-500", "dark:text-gray-400")}>
                                {completedTasksCount} of {totalTasksCount} tasks completed
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Task counts details */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div className={getThemeClasses("p-3 bg-gray-50 rounded-xl", "p-3 bg-zinc-800/40")}>
                        <span className={getThemeClasses("text-xs text-gray-500 block", "text-xs text-gray-400 block")}>In Progress</span>
                        <span className={getThemeClasses("text-lg font-bold text-gray-900", "text-lg font-bold text-white")}>
                          {taskList.filter(t => t.Status === 3).length}
                        </span>
                      </div>
                      <div className={getThemeClasses("p-3 bg-gray-50 rounded-xl", "p-3 bg-zinc-800/40")}>
                        <span className={getThemeClasses("text-xs text-gray-500 block", "text-xs text-gray-400 block")}>User Stories</span>
                        <span className={getThemeClasses("text-lg font-bold text-gray-900", "text-lg font-bold text-white")}>
                          {userStories.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 2: Goals Tracker */}
              <div className={getThemeClasses(
                "lg:col-span-1 flex flex-col bg-transparent",
                "dark:border-gray-800 dark:shadow-none"
              )}>
                <h2 className={getThemeClasses('text-xl font-semibold text-gray-900 mb-4', 'dark:text-gray-100')}>Goals</h2>
                <div className={getThemeClasses(
                  "h-full border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm bg-white",
                  "dark:bg-[#1e1e24] dark:border-gray-800 dark:shadow-none"
                )}>
                  <div>
                    {/* Goals List */}
                    <div className="space-y-3.5 max-h-[140px] overflow-y-auto pr-1">
                      {!project?.Goals || project.Goals.length === 0 ? (
                        <p className={getThemeClasses("text-xs text-gray-400 italic", "text-xs text-gray-500 italic")}>No goals defined for this project.</p>
                      ) : (
                        project.Goals.map((goal) => (
                          <div key={goal._id} className="flex items-center gap-3">
                            <span
                              role="checkbox"
                              aria-checked={!!goal.completed}
                              tabIndex={isOwner ? 0 : -1}
                              onClick={() => isOwner && handleToggleGoal(goal._id)}
                              onKeyDown={(e) => { if (isOwner && (e.key === 'Enter' || e.key === ' ')) handleToggleGoal(goal._id); }}
                              className={getThemeClasses(
                                `inline-flex items-center justify-center w-4 h-4 rounded-full border flex-shrink-0 ${goal.completed ? 'bg-green-600 border-transparent' : 'bg-white border-gray-300'} ${isOwner ? 'cursor-pointer' : 'cursor-default'}`,
                                `inline-flex items-center justify-center w-4 h-4 rounded-full border flex-shrink-0 ${goal.completed ? 'bg-green-600 border-transparent' : 'bg-transparent border-gray-600'} ${isOwner ? 'cursor-pointer' : 'cursor-default'}`
                              )}
                            >
                              {goal.completed ? (
                                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-white" fill="currentColor">
                                  <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L8.5 12.086l6.793-6.793a1 1 0 0 1 1.414 0Z" />
                                </svg>
                              ) : null}
                            </span>
                            <span className={getThemeClasses(
                              `text-xs font-semibold ${goal.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`,
                              `text-xs font-semibold ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`
                            )}>
                              {goal.text}
                            </span>
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
                        className={getThemeClasses(
                          "flex-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400",
                          "flex-1 px-2.5 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                        )}
                      />
                      <button
                        onClick={handleAddGoalDirect}
                        className={getThemeClasses(
                          'px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white rounded-lg transition-colors shadow-sm',
                          'dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'
                        )}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Teams Assigned & User Stories Row */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 mb-6">
              <div className={showUserStories ? 'lg:col-span-4' : 'lg:col-span-6'}>
                <div className="flex justify-between mb-2 gap-4">
                  <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>Teams</h2>
                  {isOwner && (
                    <form onSubmit={(e) => { e.preventDefault(); if (selectedTeam) handleAddTeam(selectedTeam.TeamID); }} className="relative">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={getThemeClasses(
                            'border rounded-xl px-3 py-1.5 w-64 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white border-gray-300 text-gray-900',
                            'dark:bg-[#18181b] dark:border-[#232323] dark:text-gray-100 dark:focus:outline-none dark:focus:ring-blue-500 dark:focus:border-blue-500'
                          )}
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
                            className={getThemeClasses(
                              'px-4 py-2 text-sm text-white font-semibold rounded-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm',
                              'dark:bg-blue-600 dark:hover:bg-blue-500'
                            )}
                            title={selectedTeam ? 'Add selected team to project' : 'Select a team from dropdown'}
                          >
                            Add
                          </button>
                        )}
                      </div>
                      {isTeamInputFocused && filteredAvailableTeams.length > 0 && (
                        <div className="absolute top-full right-0 z-50 mt-2 w-96 animate-fadeIn">
                          <ul className={getThemeClasses(
                            'border border-gray-200 rounded-xl bg-white max-h-80 overflow-y-auto shadow-2xl py-1.5 scrollbar-thin',
                            'dark:bg-[#18181b] dark:border-[#232323]'
                          )}>
                            {filteredAvailableTeams.map((team, index) => (
                              <li key={`${team.TeamID}-${index}`} className={getThemeClasses('px-3 py-1.5 border-b border-gray-100 last:border-b-0 transition-colors duration-150', 'dark:border-zinc-800/60')}>
                                <div className="flex items-center justify-between gap-2">
                                  <div
                                    className={getThemeClasses('flex-1 cursor-pointer rounded-lg p-2 hover:bg-gray-50 transition-colors duration-150', 'dark:hover:bg-zinc-800/40')}
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
                                        <div className={getThemeClasses('font-semibold text-gray-900 text-sm truncate', 'dark:text-gray-100')}>
                                          {team.TeamName}
                                        </div>
                                        {team.TeamDescription && (
                                          <div className={getThemeClasses('text-xs text-gray-500 truncate mt-0.5', 'dark:text-gray-400')}>
                                            {team.TeamDescription}
                                          </div>
                                        )}
                                        <div className={getThemeClasses('text-xs text-gray-400 mt-0.5', 'dark:text-gray-500')}>
                                          Members: {Array.isArray(team.teamMembers) ? team.teamMembers.length : (team.memberCount ?? 0)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedTeam(team); handleAddTeam(team.TeamID); }}
                                    className={getThemeClasses(
                                      'ml-1 p-2 rounded-full transition-all duration-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white',
                                      'dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white'
                                    )}
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
                              className={getThemeClasses(
                                'w-full mt-2 px-4 py-2.5 text-xs text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 rounded-xl transition-colors duration-200 border border-gray-150 bg-white shadow-sm',
                                'dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-zinc-800/40 dark:bg-[#18181b] dark:border-[#232323]'
                              )}
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
                    <div className={getThemeClasses('text-center py-8 text-gray-400', 'dark:text-gray-500')}>
                      No teams assigned to this project.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {teams.map((team) => {
                        const initials = team.TeamName.length > 0 ? team.TeamName.split(' ').map(n => n[0]).join('') : '';
                        return (
                          <div key={team.TeamID}
                            className={getThemeClasses('relative rounded-xl border border-gray-200 p-4 hover:shadow-sm transition', 'dark:border-gray-700')}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div
                                  className={getThemeClasses(
                                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0',
                                    'dark:bg-blue-900/50'
                                  )}
                                  style={{ backgroundColor: hexToRgba(team.TeamColor, theme === 'dark' ? 0.12 : 0.3) }}>
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <Link href={`/team/${team.TeamID}`} className={`${tableTextClasses} hover:text-blue-600 hover:underline transition-colors cursor-pointer block truncate`} title="View Team Details">
                                    {team?.TeamName || team.TeamID}
                                  </Link>
                                  {team?.TeamDescription && (
                                    <div className={`${tableSecondaryTextClasses} truncate`}>{team.TeamDescription}</div>
                                  )}
                                  <div className={`${tableSecondaryTextClasses} mt-1 text-sm`}>
                                    <span className={getThemeClasses('text-black text-md', 'text-white')}>Created: </span> {team.CreatedDate ? new Date(team.CreatedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusPill status={team.IsActive ? 'Active' : 'Inactive'} theme={theme} showPulseOnActive />
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
                                        className={getThemeClasses(
                                          'w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-medium shadow-sm',
                                          'dark:border-gray-700'
                                        )}
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
                                      <div className={getThemeClasses(
                                        'w-7 h-7 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center',
                                        'dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300'
                                      )}
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
                                      ? getThemeClasses('bg-blue-100 text-blue-700 hover:bg-blue-200', 'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50')
                                      : getThemeClasses('bg-green-100 text-green-700 hover:bg-green-200', 'dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/50')}`}
                                    title={team.IsActive ? 'Revoke Access' : 'Grant Access'}
                                    disabled={toggling === team.TeamID}
                                  >
                                    <FaToggleOn size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRemovingTeam(team);
                                      setShowRemoveDialog(true);
                                    }}
                                    className={getThemeClasses(
                                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                      'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                    )}
                                    title="Remove Team"
                                    disabled={removing}
                                  >
                                    <FaTimes size={14} />
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
                <div className={`lg:col-span-2`}>
                  <div className="flex justify-between mb-2">
                    <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>User Stories</h2>
                    <button
                      onClick={() => { setAddTaskTypeMode('userStory'); setIsAddTaskOpen(true); }}
                      className={getThemeClasses(
                        'flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-600 hover:text-white duration-300 rounded-lg transition-colors shadow-sm',
                        'dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'
                      )}
                    >
                      <FaPlus size={14} />
                      Create
                    </button>
                  </div>
                  <div className={`overflow-x-auto overflow-y-auto max-h-[220px] ${tableContainerClasses}`}>
                    {userStories.length === 0 ? (
                      <div className={getThemeClasses(
                        'text-center py-8 text-gray-400',
                        'dark:text-gray-500'
                      )}>
                        No user stories for this project.
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#1e1e24]' : 'bg-white'}`}>
                          <tr className={tableHeaderClasses}>
                            <th className={`py-3 px-4 text-left w-[300px] ${tableHeaderTextClasses}`}>Name</th>
                            <th className={`hidden md:table-cell py-3 px-4 text-left w-[200px] ${tableHeaderTextClasses}`}>Due Date</th>
                            <th className={`py-3 px-4 text-center w-[150px] ${tableHeaderTextClasses}`}>Status</th>
                            <th className={`py-3 px-4 text-center w-[150px] ${tableHeaderTextClasses}`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userStories.map(story => (
                            <tr key={story._id} className={tableRowClasses}>
                              <td className="py-1.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <Link href={`/task/${story.TaskID}`} className={tableTextClasses + ' hover:text-blue-600 hover:underline transition-colors cursor-pointer'} title="View User Story Details">
                                      {story.Name}
                                    </Link>
                                    <div className="flex items-center justify-start gap-1 min-w-0 w-full text-xs mt-0.5">
                                      {story.TicketNumber && (
                                        <span className="font-semibold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                                          #{story.TicketNumber}
                                        </span>
                                      )}
                                      {story.TicketNumber && story.Description && (
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
                                {getTaskStatusBadge(story.Status, theme === 'dark', getTaskStatusText(story.Status))}
                              </td>
                              <td className="py-1.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditTask(story)}
                                    className={getThemeClasses(
                                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                                      'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                                    )}
                                    title="Edit User Story"
                                  >
                                    <FaEdit size={12} />
                                  </button>
                                  <button
                                    onClick={() => confirmDeleteUserStory(story)}
                                    className={getThemeClasses(
                                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                      'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                    )}
                                    title="Delete User Story"
                                  >
                                    <FaTrash size={12} />
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
                  <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>Tasks</h2>
                  <div className="flex items-center gap-3">
                    {selectedTasks.length > 0 ? (
                      <>
                        <div className={getThemeClasses(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700',
                          'dark:bg-blue-900/30 dark:text-blue-300'
                        )}>
                          <span className="text-sm font-medium">{selectedTasks.length} selected</span>
                          <button
                            onClick={() => setSelectedTasks([])}
                            className={getThemeClasses(
                              'p-1 hover:bg-blue-100 rounded-full transition-colors',
                              'dark:hover:bg-blue-900/50'
                            )}
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => setShowBulkDeleteDialog(true)}
                          className={getThemeClasses(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors',
                            'dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                          )}
                        >
                          <MdDelete size={18} />
                          Delete Selected
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setAddTaskTypeMode('task'); setIsAddTaskOpen(true); }}
                        className={getThemeClasses(
                          'flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm',
                          'dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'
                        )}
                      >
                        <FaPlus size={14} />
                        Create
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className={`overflow-x-auto overflow-y-auto max-h-[80vh] custom-scrollbar mb-2 rounded-xl border ${getThemeClasses('border-gray-200', 'dark:border-gray-700')}`}>
                {taskList.length === 0 ? (
                  <div className={getThemeClasses(
                    'text-center py-8 text-gray-400',
                    'dark:text-gray-500'
                  )}>
                    No tasks for this project.
                  </div>
                ) : (
                  <table className="w-full table-fixed">
                    <thead className={`sticky top-0 z-10 border-b ${theme === 'dark' ? 'bg-[#18181b] border-gray-500' : 'bg-gray-50 border-gray-200'}`}>
                      <tr className={tableHeaderClasses}>
                        <th className="py-3 px-4 text-center w-[50px]">
                          <input
                            type="checkbox"
                            checked={selectedTasks.length === taskList.length && taskList.length > 0}
                            onChange={handleSelectAllTasks}
                            className={getThemeClasses(
                              'hidden sm:table-cell w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                              'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                            )}
                          />
                        </th>
                        <th className={`py-3 px-4 text-left w-[41%] ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('name')} className="inline-flex items-center gap-1 w-full text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            <span>Name</span>
                            {getTasksSortIcon('name')}
                          </button>
                        </th>
                        <th className={`hidden md:table-cell py-3 px-4 text-left w-[15%] ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('assignedTo')} className="inline-flex items-center gap-1 w-full text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            <span>Assigned To</span>
                            {getTasksSortIcon('assignedTo')}
                          </button>
                        </th>
                        <th className={`hidden md:table-cell py-3 px-4 w-[9%] ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('assignedDate')} className="inline-flex items-center justify-center w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            <span>Assigned On</span>
                            {getTasksSortIcon('assignedDate')}
                          </button>
                        </th>
                        <th className={`hidden md:table-cell py-3 px-4 w-[9%] ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('dueDate')} className="inline-flex items-center justify-center w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
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
                        <th className={`py-3 px-4 text-center w-[8%] ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('status')} className="inline-flex items-center justify-center gap-1 w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            <span>Status</span>
                            {getTasksSortIcon('status')}
                          </button>
                        </th>
                        <th className={`py-3 px-4 text-center w-[8%] ${tableHeaderTextClasses}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasksSorted.map(task => {
                        const getPriorityBackgroundColor = (priority) => {
                          const styles = {
                            'High': 'bg-red-50 dark:bg-red-900/10',
                            'Medium': 'bg-yellow-50 dark:bg-yellow-900/10',
                            'Low': 'bg-green-50 dark:bg-green-900/10'
                          };
                          return styles[priority] || '';
                        };

                        const ticketRowClasses = task.Type === 'Support'
                          ? `${tableRowClasses} ${getPriorityBackgroundColor(task.Priority)}`
                          : tableRowClasses;

                        return (
                          <tr key={task._id} className={ticketRowClasses}>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedTasks.includes(task.TaskID)}
                                onChange={() => handleSelectTask(task.TaskID)}
                                className={getThemeClasses(
                                  'hidden sm:table-cell w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                  'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                                )}
                              />
                            </td>
                            <td className="py-3 px-4 overflow-hidden">
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 mb-1 w-full min-w-0">
                                  <button
                                    onClick={() => router.push(`/task/${task.TaskID}`)}
                                    className={getThemeClasses(
                                      'text-left hover:text-blue-600 hover:underline transition-colors cursor-pointer font-medium truncate block max-w-full',
                                      'dark:hover:text-blue-400'
                                    )}
                                    title={task.Name}
                                  >
                                    {task.Name}
                                  </button>
                                  {getTaskTypeBadgeComponent(task.Type)}
                                </div>
                                <div className="flex items-center justify-start gap-1 min-w-0 w-full text-xs">
                                  {task.TicketNumber && (
                                    <span className="font-semibold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                                      #{task.TicketNumber}
                                    </span>
                                  )}
                                  {task.TicketNumber && task.Description && (
                                    <span className="text-gray-300 dark:text-gray-600 shrink-0">•</span>
                                  )}
                                  <span className={getThemeClasses(
                                    'text-gray-500 truncate block',
                                    'dark:text-gray-400'
                                  )} title={task.Description}>{task.Description}</span>
                                </div>
                                {/* Show assigned to on mobile if available */}
                                {task.AssignedTo && task.AssignedToDetails && (
                                  <div className={getThemeClasses(
                                    'md:hidden mt-1 flex items-center gap-1 text-xs text-gray-600',
                                    'dark:text-gray-300'
                                  )}>
                                    <span className="font-medium">Assigned to:</span>
                                    <span>{task.AssignedToDetails.fullName}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="hidden md:table-cell py-3 px-4">
                              {task.AssignedTo && task.AssignedToDetails ? (
                                <div className="flex items-center gap-3">
                                  <div className={getThemeClasses(
                                    'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm',
                                    'dark:from-blue-600 dark:to-blue-700'
                                  )}>
                                    {task.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={tableTextClasses}>{task.AssignedToDetails.fullName} <span className={'text-xs'}>{isMe(task.AssignedTo) ? ' (You)' : ''}</span></span>
                                    {task.AssignedToDetails.teamName && (
                                      <span className={tableSecondaryTextClasses}>{task.AssignedToDetails.teamName}</span>
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
                                <div className="flex flex-col leading-tight">
                                  <span>{new Date(task.AssignedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                  <span className={getThemeClasses('text-xs text-gray-500', 'text-xs text-gray-400')}>
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
                                {task.Type !== 'User Story' && task.Priority && getPriorityBadge(task.Priority)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getTaskStatusBadge(task.Status, theme === 'dark', getTaskStatusText(task.Status))}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className={getThemeClasses(
                                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                                    'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                                  )}
                                  title="Edit Task"
                                >
                                  <FaEdit size={12} />
                                </button>
                                <button
                                  onClick={() => confirmDeleteTask(task)}
                                  className={getThemeClasses(
                                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                    'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                  )}
                                  title="Delete Task"
                                  disabled={removing}
                                >
                                  <MdDelete size={16} />
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
          <div className="overflow-x-auto">
            <table className="w-full cursor-pointer">
              <tbody className={getThemeClasses('', 'bg-[#18181b]')}>
                {[
                  { code: 1, label: 'Not Assigned' },
                  { code: 2, label: 'Assigned' },
                  { code: 3, label: 'In Progress' },
                  { code: 4, label: 'QA' },
                  { code: 5, label: 'Deployment' },
                  { code: 6, label: 'Completed' }
                ].map(({ code, label }, indexx) => {
                  const tasksByStatus = (taskList || []).filter(t => t.Status === code);

                  // Flatten tasks and subtasks into a single array
                  const flattenedItems = [];
                  tasksByStatus.forEach(task => {
                    // Add the main task
                    flattenedItems.push({ ...task, isSubtask: false });

                    // Add subtasks if they exist
                    if (task.subtasks && task.subtasks.length > 0) {
                      task.subtasks.forEach(subtask => {
                        flattenedItems.push({
                          ...subtask,
                          isSubtask: true,
                          parentTask: task,
                          // Map subtask fields to task-like structure
                          Name: subtask.Name,
                          Description: '', // Subtasks typically don't have descriptions
                          Status: task.Status, // Use parent task status for background color
                          AssignedTo: subtask.CompletedBy, // Map CompletedBy to AssignedTo
                          AssignedToDetails: subtask.CompletedByDetails,
                          Assignee: subtask.CreatedBy, // Map CreatedBy to Assignee
                          AssigneeDetails: subtask.CreatedByDetails,
                          IsCompleted: subtask.IsCompleted,
                          AssignedDate: subtask.CompletedDate,
                          DueDate: task.DueDate
                        });
                      });
                    }
                  });
                  const statusStyle = getTaskStatusStyle(code, theme === 'dark');
                  const StatusIcon = statusStyle.icon;

                  return (
                    <React.Fragment key={code}>
                      {/* Status Header Row */}
                      <tr>
                        <td colSpan="8" className="p-0">
                          <div className={`flex items-center ${indexx === 0 ? '' : 'mt-2'}`}>
                            <div className="flex items-center justify-center w-8 h-12" onClick={(e) => { e.preventDefault(); toggleAccordion(code); }}>
                              {openAccordions[code] ? (
                                <FaSortUp className={`${statusStyle.iconColor} transition-transform duration-300 cursor-pointer`} size={14} />
                              ) : (
                                <FaSortDown className={`${statusStyle.iconColor} transition-transform duration-300 cursor-pointer`} size={14} />
                              )}
                            </div>
                            <div className={`flex-1 cursor-pointer select-none px-4 py-3 font-semibold rounded-lg ${statusStyle.textColor} bg-gradient-to-r ${statusStyle.bgColor} ${statusStyle.borderColor} flex items-center justify-start gap-3`}
                              onClick={(e) => { e.preventDefault(); toggleAccordion(code); }} >
                              <div className="flex items-center gap-3">
                                <StatusIcon className={statusStyle.iconColor} size={16} />
                                <span>{label}</span>
                              </div>
                              <span className={`text-sm ${statusStyle.textColor} opacity-70`}>{tasksByStatus.length}</span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Task Rows */}
                      <tr>
                        <td colSpan="8" className="p-0">
                          <div className={`accordion-content ${openAccordions[code] ? 'open' : 'closed'}`}>
                            {flattenedItems.length > 0 && (
                              <table className="w-full table-fixed">
                                <thead>
                                  <tr className={getThemeClasses('text-left text-xs font-medium text-gray-400 uppercase', 'bg-[#18181b]')}>
                                    <th className="py-3 px-4 tracking-wider w-8"></th>
                                    <th className={`py-3 px-4 tracking-wider w-1/3 ${getThemeClasses('border-b border-gray-200', 'border-gray-700')}`}>Task</th>
                                    <th className={`py-3 px-4 tracking-wider w-1/6 ${getThemeClasses('border-b border-gray-200', 'border-gray-700')}`}>Assigned To</th>
                                    <th className={`py-3 px-4 tracking-wider hidden sm:table-cell w-24 ${getThemeClasses('border-b border-gray-200', 'border-gray-700')}`}>Assigned On</th>
                                    <th className={`py-3 px-4 tracking-wider hidden sm:table-cell w-20 ${getThemeClasses('border-b border-gray-200', 'border-gray-700')}`}>Priority</th>
                                    <th className={`py-3 px-4 tracking-wider hidden sm:table-cell w-20 ${getThemeClasses('border-b border-gray-200', 'border-gray-700')}`}>Task Type</th>
                                    <th className={`py-3 px-4 tracking-wider text-center hidden sm:table-cell w-24 ${getThemeClasses('border-b border-gray-200', 'border-gray-700')}`}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {flattenedItems.map((item, index) => {
                                    return (
                                      <tr key={item.isSubtask ? `subtask-${item.SubtaskID}` : `task-${item.TaskID}`}
                                        className={item.isSubtask ? `bg-opacity-10 ${statusStyle.bgColor.replace('bg-gradient-to-r', '').trim()}` : ''} >
                                        <td className={`w-8 ${item.isSubtask ? 'py-2' : 'py-3'} px-4`}></td>
                                        <td className={`px-4 ${item.isSubtask ? 'py-2' : 'py-1'} w-1/3`}>
                                          <div className={`flex flex-col ${item.isSubtask ? 'ml-4' : ''}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                              {item.isSubtask ? (
                                                <div className="flex items-center gap-1">
                                                  <FiCornerDownRight className='text-gray-400' />
                                                  <div
                                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${item.IsCompleted
                                                      ? 'bg-green-500 border-green-500'
                                                      : getThemeClasses('border-gray-300 hover:border-gray-400', 'border-gray-600 hover:border-gray-500')
                                                      } ${togglingSubtasks.has(item.SubtaskID) ? 'opacity-50' : ''}`}
                                                    onClick={() => handleSubtaskToggle(item.SubtaskID, item.parentTask.TaskID)}
                                                    title={item.IsCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                                                  >
                                                    {item.IsCompleted && (
                                                      <FaCheck size={8} className="text-white" />
                                                    )}
                                                    {togglingSubtasks.has(item.SubtaskID) && (
                                                      <FaSpinner size={8} className="text-white animate-spin" />
                                                    )}
                                                  </div>
                                                  <span className={getThemeClasses(
                                                    `text-sm font-medium ${item.IsCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`,
                                                    `text-sm font-medium ${item.IsCompleted ? 'line-through text-gray-500' : 'text-gray-300'}`
                                                  )}>
                                                    {item.Name}
                                                  </span>
                                                </div>
                                              ) : (
                                                <div className="flex flex-col items-start gap-1">
                                                  <button
                                                    onClick={() => router.push(`/task/${item.TaskID}`)}
                                                    className={getThemeClasses(
                                                      'text-left text-gray-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer font-medium text-md',
                                                      'text-white hover:text-blue-400'
                                                    )}
                                                    title="Click to view task details"
                                                  >
                                                    {item.Name}
                                                  </button>
                                                  <span className={getThemeClasses(
                                                    'text-xs text-gray-500',
                                                    'dark:text-gray-400'
                                                  )}>{item.Description}</span>
                                                </div>
                                              )}
                                            </div>

                                          </div>
                                        </td>
                                        <td className={`px-4 ${item.isSubtask ? 'py-2' : 'py-3'} w-1/6`}>
                                          {item.AssignedTo && item.AssignedToDetails ? (
                                            <div className={`flex items-center ${item.isSubtask ? '' : 'gap-3'}`}>
                                              {!item.isSubtask && (
                                                <div className={getThemeClasses(
                                                  'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm',
                                                  'dark:from-blue-600 dark:to-blue-700'
                                                )}>
                                                  {item.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                              )}
                                              <div className="flex flex-col">
                                                <span className={getThemeClasses('text-sm font-medium text-gray-900', 'dark:text-gray-100')}>
                                                  {item.AssignedToDetails.fullName} <span className={'text-xs'}>{isMe(item.AssignedTo) ? ' (You)' : ''}</span>
                                                </span>
                                                {item.AssignedToDetails.teamName && (
                                                  <span className={getThemeClasses('text-xs text-gray-500', 'dark:text-gray-400')}>{item.AssignedToDetails.teamName}</span>
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center">
                                              <span className={getThemeClasses('text-sm text-gray-500', 'dark:text-gray-400')}>Not Assigned</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className={`px-4 hidden sm:table-cell ${item.isSubtask ? 'py-2' : 'py-3'} w-24`}>
                                          {!item.isSubtask ? (
                                            <span className={getThemeClasses('text-sm text-gray-900', 'dark:text-gray-100')}>
                                              {item.AssignedDate ? formatDate(item.AssignedDate) : '-'}
                                            </span>
                                          ) : (
                                            <span className={getThemeClasses('text-sm text-gray-900', 'dark:text-gray-100')}>{item.CreatedDate ? formatDate(item.CreatedDate) : '-'}</span>
                                          )}
                                        </td>
                                        <td className={`px-4 hidden sm:table-cell ${item.isSubtask ? 'py-2' : 'py-3'} w-20`}>
                                          {!item.isSubtask && item.Priority && getPriorityBadge(item.Priority)}
                                        </td>
                                        <td className={`px-4 hidden sm:table-cell ${item.isSubtask ? 'py-2' : 'py-3'} w-20`}>
                                          {!item.isSubtask && getTaskTypeBadgeComponent(item.Type)}
                                        </td>
                                        <td className={`px-4 hidden sm:table-cell ${item.isSubtask ? 'py-2' : 'py-3'} w-24`}>
                                          {!item.isSubtask && (
                                            <div className="flex items-center justify-center gap-2">
                                              <button
                                                onClick={() => router.push(`/task/${item.TaskID}`)}
                                                className={getThemeClasses(
                                                  'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                                                  'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                                                )}
                                                title="Open Task"
                                              >
                                                <FaExternalLinkAlt size={14} />
                                              </button>
                                              <button
                                                onClick={() => confirmDeleteTask(item)}
                                                className={getThemeClasses(
                                                  'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                                  'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                                )}
                                                title="Delete Task"
                                              >
                                                <MdDelete size={18} />
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Empty State Row */}
                      <tr>
                        <td colSpan="8" className="p-0">
                          <div className={`accordion-content ${openAccordions[code] ? 'open' : 'closed'}`}>
                            {flattenedItems.length === 0 && (
                              <div className={getThemeClasses('px-4 py-6 text-gray-500 text-center', 'px-4 py-6 text-gray-400 text-center')}>
                                No tasks
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'knowledge' && userDetails?.role === 'Admin' ? (
          <RAGManagement organizationId={project?.OrganizationID} />
        ) : activeTab === 'reports' && isOwner ? (
          <ReportGenerator
            projectId={projectId}
            projectName={project?.Name}
            inline={true}
          />
        ) : activeTab === 'releases' ? (
          <ReleaseSummaryGenerator
            projectId={projectId}
            projectName={project?.Name}
            theme={theme}
          />
        ) : null}

        {showSettingsModal && (
          <div className="fixed inset-0 z-40">
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isModalClosing ? 'opacity-0' : isModalOpening ? 'opacity-0' : 'opacity-100'}`}
              onClick={handleCloseModal}
            />
            <div className={`absolute right-0 top-16 bottom-0 w-full lg:max-w-xl ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isModalClosing ? 'translate-x-full' : isModalOpening ? 'translate-x-full' : 'translate-x-0'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={getThemeClasses("text-xl font-semibold text-gray-900", "text-xl font-semibold text-white")}>{settingsForm.Name}</h3>
                <button
                  onClick={handleCloseModal}
                  className={getThemeClasses(
                    "text-gray-400 hover:text-gray-600 text-2xl font-bold",
                    "text-gray-400 hover:text-gray-300 text-2xl font-bold"
                  )}
                >
                  ×
                </button>
              </div>
              {project.ModifiedDate && (
                <div className={getThemeClasses(
                  "text-sm text-gray-500 mb-4 flex items-center gap-1",
                  "text-sm text-white mb-4 flex items-center gap-1"
                )}>
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
                    <FaProjectDiagram className={getThemeClasses(
                      'text-gray-500',
                      'text-white'
                    )} size={16} />
                    <label className={getThemeClasses("text-sm font-medium text-gray-700", "text-sm font-medium text-white")}>Name</label>
                  </div>
                  <input
                    type="text"
                    value={settingsForm.Name}
                    onChange={e => setSettingsForm(f => ({ ...f, Name: e.target.value }))}
                    className={getThemeClasses(
                      "flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400",
                      "flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500"
                    )}
                    maxLength={50}
                    required
                    placeholder="Enter project name"
                  />
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 min-w-[120px] pt-2">
                    <FaAlignLeft className={getThemeClasses(
                      'text-gray-500',
                      'text-white'
                    )} size={16} />
                    <label className={getThemeClasses("text-sm font-medium text-gray-700", "text-sm font-medium text-white")}>Description</label>
                  </div>
                  <textarea
                    value={settingsForm.Description}
                    onChange={e => setSettingsForm(f => ({ ...f, Description: e.target.value }))}
                    className={getThemeClasses(
                      "flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 resize-none",
                      "flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500 resize-none"
                    )}
                    rows={5}
                    placeholder="Enter project description"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <FaCalendarAlt className={getThemeClasses(
                      'text-gray-500',
                      'text-white'
                    )} size={16} />
                    <label className={getThemeClasses("text-sm font-medium text-gray-700", "text-sm font-medium text-white")}>Due Date</label>
                  </div>
                  <input
                    type="date"
                    value={settingsForm.DueDate}
                    onChange={e => setSettingsForm(f => ({ ...f, DueDate: e.target.value }))}
                    className={getThemeClasses(
                      "flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900",
                      "flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white"
                    )}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <FaTag className={getThemeClasses(
                      'text-gray-500',
                      'text-white'
                    )} size={16} />
                    <label className={getThemeClasses("text-sm font-medium text-gray-700", "text-sm font-medium text-white")}>Status</label>
                  </div>
                  <div className="flex-1 relative">
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(open => !open)}
                      className={getThemeClasses(
                        "w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 flex items-center gap-2",
                        "w-full px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white flex items-center gap-2"
                      )}
                    >
                      {getProjectStatusBadge(getProjectStatus(settingsForm.ProjectStatusID), false)}
                      <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showStatusDropdown && (
                      <div className={`absolute z-50 w-full mt-1 border rounded-xl shadow-lg ${theme === 'dark'
                        ? 'bg-[#18181b] border-gray-600'
                        : 'bg-white border-gray-200'
                        }`}>
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
                              className={`w-full px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-2 ${theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-800'
                                : 'text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                              {getProjectStatusBadge(status, false)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>



                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className={getThemeClasses(
                      "px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200",
                      "px-6 py-2.5 text-gray-300 hover:bg-[#424242] rounded-xl border border-gray-600 transition-all duration-200"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={getThemeClasses(
                      "px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200",
                      "px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
                    )}
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
            </div>
          </div>
        )}
        {/* Remove Team Confirmation Dialog */}
        {showRemoveDialog && removingTeam && (
          <CustomModal
            isOpen={showRemoveDialog}
            onClose={() => {
              setShowRemoveDialog(false);
              setRemovingTeam(null);
            }}
            title="Remove Team"
            getThemeClasses={getThemeClasses}
            actions={
              <>
                <button
                  onClick={() => {
                    setShowRemoveDialog(false);
                    setRemovingTeam(null);
                  }}
                  className={getThemeClasses(
                    'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                    'dark:text-gray-400 dark:hover:bg-gray-700'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveTeam(removingTeam.TeamID)}
                  className={getThemeClasses(
                    'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
                    'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                  )}
                  disabled={removing}
                >
                  {removing ? 'Removing...' : 'Remove'}
                </button>
              </>
            }
          >
            <p className={getThemeClasses(
              'text-gray-600',
              'dark:text-gray-400'
            )}>
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
            getThemeClasses={getThemeClasses}
            actions={
              <>
                <button
                  onClick={() => {
                    setShowRevokeDialog(false);
                    setRevokingTeam(null);
                  }}
                  className={getThemeClasses(
                    'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                    'dark:text-gray-400 dark:hover:bg-gray-700'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleToggleTeamStatus(revokingTeam.TeamID)}
                  className={getThemeClasses(
                    `px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 ${revokingTeam.IsActive
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    }`,
                    `dark:${revokingTeam.IsActive
                      ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                      : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'
                    }`
                  )}
                  disabled={toggling === revokingTeam.TeamID}
                >
                  {toggling === revokingTeam.TeamID ? 'Updating...' : 'Confirm'}
                </button>
              </>
            }
          >
            <p className={getThemeClasses(
              'text-gray-600',
              'dark:text-gray-400'
            )}>
              {revokingTeam.IsActive
                ? `Are you sure you want to revoke access for ${orgTeams.find(t => t.TeamID === revokingTeam.TeamID)?.TeamName || revokingTeam.TeamID}? This will make the team inactive for this project.`
                : `Are you sure you want to grant access for ${orgTeams.find(t => t.TeamID === revokingTeam.TeamID)?.TeamName || revokingTeam.TeamID}? This will make the team active for this project.`
              }
            </p>
          </CustomModal>
        )}
        <AddTaskModal
          isOpen={isAddTaskOpen}
          onClose={() => {
            setIsAddTaskOpen(false);
            setEditingTask(null);
          }}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          mode="fromProject"
          projectIdDefault={projectId}
          userStories={userStories}
          editingTask={editingTask}
          addTaskTypeMode={addTaskTypeMode}
          projectMembers={projectMembers}
        />

        {/* Delete Task Confirmation Dialog */}
        {showDeleteTaskDialog && taskToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={getThemeClasses(
              "bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100",
              "dark:bg-gray-800 dark:border-gray-700"
            )}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className={getThemeClasses("text-lg font-semibold text-gray-900", "dark:text-gray-100")}>
                  Delete Task
                </h3>
              </div>
              <div className="mb-6">
                <p className={getThemeClasses("text-gray-600 mb-4", "dark:text-gray-300")}>
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
                <div className={getThemeClasses(
                  "bg-red-50 border border-red-100 rounded-lg p-4",
                  "dark:bg-red-900/20 dark:border-red-800"
                )}>
                  <h4 className={getThemeClasses("font-medium text-red-800 mb-1", "dark:text-red-300")}>{taskToDelete.Name}</h4>
                  <p className={getThemeClasses("text-sm text-red-700", "dark:text-red-400")}>{taskToDelete.Description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {getTaskTypeBadgeComponent(taskToDelete.Type)}
                    <span className={getThemeClasses("text-xs text-red-600", "dark:text-red-400")}>
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
                  className={getThemeClasses(
                    "px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200",
                    "dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
                  )}
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
            <div className={getThemeClasses(
              "bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100",
              "dark:bg-gray-800 dark:border-gray-700"
            )}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className={getThemeClasses("text-lg font-semibold text-gray-900", "dark:text-gray-100")}>
                  Delete Selected Tasks
                </h3>
              </div>
              <div className="mb-6">
                <p className={getThemeClasses("text-gray-600 mb-4", "dark:text-gray-300")}>
                  Are you sure you want to delete {selectedTasks.length} selected task{selectedTasks.length !== 1 ? 's' : ''}? This action cannot be undone.
                </p>
                <div className={getThemeClasses(
                  "bg-red-50 border border-red-100 rounded-lg p-4 max-h-32 overflow-y-auto",
                  "dark:bg-red-900/20 dark:border-red-800"
                )}>
                  <h4 className={getThemeClasses("font-medium text-red-800 mb-2", "dark:text-red-300")}>Tasks to be deleted:</h4>
                  {taskList
                    .filter(task => selectedTasks.includes(task.TaskID))
                    .slice(0, 5)
                    .map(task => (
                      <div key={task.TaskID} className={getThemeClasses("text-sm text-red-700 mb-1", "dark:text-red-400")}>
                        • {task.Name}
                      </div>
                    ))}
                  {selectedTasks.length > 5 && (
                    <div className={getThemeClasses("text-sm text-red-600 italic", "dark:text-red-400")}>
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
                  className={getThemeClasses(
                    "px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200",
                    "dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
                  )}
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
          getThemeClasses={getThemeClasses}
          actions={
            <>
              <button
                onClick={() => {
                  setShowDeleteUserStoryDialog(false);
                  setUserStoryToDelete(null);
                }}
                className={getThemeClasses(
                  'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                  'dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600'
                )}
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
            <p className={getThemeClasses('text-gray-600 mb-4', 'dark:text-gray-300')}>
              Are you sure you want to delete this user story? This action cannot be undone.
            </p>
            {userStoryToDelete && (
              <div className={getThemeClasses(
                'bg-red-50 border border-red-100 rounded-lg p-4',
                'dark:bg-red-900/20 dark:border-red-800'
              )}>
                <h4 className={getThemeClasses('font-medium text-red-800 mb-1', 'dark:text-red-300')}>
                  {userStoryToDelete.Name}
                </h4>
                <p className={getThemeClasses('text-sm text-red-700', 'dark:text-red-400')}>
                  {userStoryToDelete.Description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {getTaskTypeBadgeComponent(userStoryToDelete.Type)}
                  <span className={getThemeClasses('text-xs text-red-600', 'dark:text-red-400')}>
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
            <div className={`max-w-md w-full mx-4 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Repository Settings
                  </h3>
                  <button
                    onClick={() => setShowRepositoryModal(false)}
                    className={`p-2 rounded-lg hover:bg-opacity-10 ${theme === 'dark' ? 'hover:bg-white text-white' : 'hover:bg-gray-900 text-gray-900'}`}
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FaGithub className="text-green-600" size={20} />
                    <div>
                      <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {projectRepository.repositoryFullName}
                      </h4>
                      {projectRepository.repositoryDescription && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {projectRepository.repositoryDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    {projectRepository.repositoryLanguage && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        <FaCode size={10} />
                        {projectRepository.repositoryLanguage}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                      <FaStar size={10} />
                      {projectRepository.repositoryStars}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                      <FaCodeBranch size={10} />
                      {projectRepository.repositoryForks}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={projectRepository.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'}`}
                    >
                      <FaLink size={14} />
                      View Repository
                    </a>
                    <button
                      onClick={handleUnlinkRepository}
                      disabled={unlinkingRepository}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
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