import React, { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import StatusPill from '../../components/shared/StatusPill';
import api, { authService, taskService, githubService } from '../../services/api';
import { FaCheck, FaExternalLinkAlt , FaEdit, FaTimes, FaSpinner, FaCode, FaQuestionCircle, FaInfoCircle, FaProjectDiagram, FaChartBar, FaToggleOn, FaPlus, FaGithub, FaLink, FaUnlink, FaStar, FaCodeBranch, FaFile, FaAlignLeft, FaCalendarAlt, FaTag, FaFileAlt, FaRobot, FaSort, FaSortUp, FaSortDown, FaList } from 'react-icons/fa';
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
import { getProjectStatusBadge } from '../../components/project/ProjectStatusBadge';
import { getPriorityBadge, getTaskStatusBadge, getTaskStatusStyle } from '../../components/task/TaskTypeBadge';
import ProjectDetailsSkeleton from '../../components/skeletons/ProjectDetailsSkeleton';
import ProjectFilesTab from '../../components/project/ProjectFilesTab';
import ProjectActivity from '../../components/project/ProjectActivity';
import GanttChart from '../../components/project/GanttChart';
import ReportGenerator from '../../components/reports/ReportGenerator';
import RAGManagement from '../../components/rag/RAGManagement';
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
    userDetails
  } = useGlobal();
  const { showToast } = useToast();
  const [project, setProject] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgTeams, setOrgTeams] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
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

  // Sorting state for Tasks table
  const [tasksSortKey, setTasksSortKey] = useState('name'); // name | assignedTo | assignee | assignedDate | priority | status
  const [tasksSortDir, setTasksSortDir] = useState('asc'); // asc | desc

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

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  // Join project room and subscribe to project-level task updates to keep counts and lists fresh
  useEffect(() => {
    if (!projectId) return;
    connectSocket();
    try { getSocket().emit('project.join', { projectId }); } catch (_) { }
    const offCreated = subscribe('kanban.task.created', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      setTaskList(prev => [...prev, data.task]);
    });
    const offUpdated = subscribe('kanban.task.updated', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      setTaskList(prev => prev.map(t => t.TaskID === data.task.TaskID ? { ...t, ...data.task } : t));
    });
    const offStatus = subscribe('kanban.task.status.updated', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      setTaskList(prev => prev.map(t => t.TaskID === data.taskId ? { ...t, Status: data.status } : t));
    });
    const offDeleted = subscribe('kanban.task.deleted', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      setTaskList(prev => prev.filter(t => t.TaskID !== data.taskId));
    });
    const offAssigned = subscribe('kanban.task.assigned', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      setTaskList(prev => prev.map(t => t.TaskID === data.taskId ? { ...t, AssignedTo: data.assignedTo, Status: data.status } : t));
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

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      // Fetch all project details in one call
      api.get(`/project-details/${projectId}`)
        .then(res => {
          setProject(res.data.project);
          setTeams(res.data.teams);
          setOrgTeams(res.data.orgTeams);
          setTaskList(res.data.taskList);
          setUserStories(res.data.userStories);
          setProjectMembers(res.data.projectMembers || []);
          setProjectActivity(res.data.activity || []);
        })
        .catch(err => {
          setError('Failed to fetch project');
          router.push('/dashboard');
        })
        .finally(() => setLoading(false));
    }
  }, [projectId, router]);


  // Fetch project repository information
  useEffect(() => {
    if (projectId && currentUser) {
      fetchProjectRepository();
    }
  }, [projectId, currentUser]);

  // Fetch commits when repository tab is active and repository is connected
  useEffect(() => {
    if (activeTab === 'repo' && projectRepository?.connected) {
      fetchCommits(1);
      fetchIssues(1);
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
      const response = await authService.getUserRepositories(currentUser._id);
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
      const response = await authService.linkRepositoryToProject(projectId, repository, currentUser._id);
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
    if (!projectRepository?.connected) return;

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
    if (!projectRepository?.connected) return;

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
      console.log('showAllTeams', orgTeams);
      // When search is empty, show first 10 teams by default
      const assignedIds = new Set(teams.map(t => t.TeamID));
      const availableTeams = orgTeams.filter(t => !assignedIds.has(t.TeamID));
      setFilteredAvailableTeams(showAllTeams ? availableTeams : availableTeams.slice(0, 5));
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

  const isOwner = currentUser && project && currentUser._id === project.ProjectOwner;

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
        ModifiedBy: currentUser._id,
        ModifiedDate: new Date()
      });
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
      console.log(res.data);

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
      showToast('Task added successfully!', 'success');

      // Update task list directly instead of refetching
      if (newTask.Type === 'User Story') {
        setUserStories(prev => [...prev, newTask]);
      } else {
        setTaskList(prev => [...prev, newTask]);
      }

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
    const copy = [...taskList];
    const dir = tasksSortDir === 'asc' ? 1 : -1;
    // Always show Not Assigned (Status === 1) first
    copy.sort((a, b) => {
      const aUnassigned = a.Status === 1 ? 0 : 1;
      const bUnassigned = b.Status === 1 ? 0 : 1;
      if (aUnassigned !== bUnassigned) return aUnassigned - bUnassigned;
      const getAssignedTo = (t) => t.AssignedToDetails?.fullName || '';
      const getAssignee = (t) => t.AssigneeDetails?.fullName || '';
      const getStatus = (t) => (t.Status || '').toString();
      switch (tasksSortKey) {
        case 'name':
          return (a.Name || '').localeCompare(b.Name || '') * dir;
        case 'assignedTo':
          return getAssignedTo(a).localeCompare(getAssignedTo(b)) * dir;
        case 'assignee':
          return getAssignee(a).localeCompare(getAssignee(b)) * dir;
        case 'assignedDate': {
          const av = a.AssignedDate ? new Date(a.AssignedDate).getTime() : 0;
          const bv = b.AssignedDate ? new Date(b.AssignedDate).getTime() : 0;
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

                  {projectRepository?.connected && (
                    <button
                      onClick={() => setActiveTab('repo')}
                      className={`${activeTab === 'repo'
                        ? theme === 'dark'
                          ? 'border-blue-400 text-blue-400'
                          : 'border-blue-600 text-blue-600'
                        : theme === 'dark'
                          ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                    >
                      <FaGithub size={16} />
                      <span>Repo</span>
                    </button>
                  )}
                  {currentUser?.role === 'Admin' && (
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
                    <div className="py-2 flex gap-2">
                      <button
                        className={getThemeClasses(
                          "flex items-center gap-2 p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors",
                          "dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-800"
                        )}
                        title="Generate AI Report"
                        onClick={() => setShowReportGenerator(true)}
                      >
                        <FaFileAlt size={18} />
                        {/* Generate Report */}
                      </button>
                    </div>
                    <div className="py-2">
                      <button
                        className={getThemeClasses(
                          "flex items-center gap-2 p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors",
                          "dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                        )}
                        title="Project Settings"
                        onClick={handleOpenModal}
                      >
                        <FaEdit size={18} />
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
            {/* Project Description - Desktop View */}
            <div className={getThemeClasses(
              'hidden md:flex w-full items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm',
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
                    Project Description
                  </h3>
                  {project.Description ? (
                    <p className={getThemeClasses(
                      'text-sm text-blue-700 leading-relaxed',
                      'dark:text-blue-200'
                    )}>
                      {project.Description}
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

              <div className="flex items-center justify-between gap-2">
                {/* Right side - Deadline Status */}
                {project.DueDate && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(() => {
                      const status = getDeadlineStatusComponent(deadline);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-gradient-to-r ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                          <span className={`w-2 h-2 rounded-full ${status.dotColor} ${deadline !== 'Deadline Passed' && deadline !== 'No Deadline' ? 'animate-pulse' : ''}`}></span>
                          {status.text}
                        </span>
                      );
                    })()}
                  </div>
                )}
                {/* Project Title, Status, Description */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {project && (
                      <div>{getProjectStatusBadgeComponent(project.ProjectStatusID)}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Team Member Initials - Show for all users */}
                    {projectMembers.length > 0 && (
                      <div className="flex items-center gap-3">

                        <div className="flex items-center gap-1">
                          {projectMembers.slice(0, 3).map((member, idx) => (
                            <div
                              key={member._id}
                              className={getThemeClasses(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden bg-gradient-to-r from-purple-500 to-purple-700",
                                "dark:border-gray-700"
                              )}
                              style={{ marginLeft: idx === 0 ? '0' : '-10px' }}
                              title={`${member.firstName} ${member.lastName}`}
                            >
                              {member.profileImage ? (
                                <img
                                  src={member.profileImage}
                                  alt={`${member.firstName} ${member.lastName}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className={getThemeClasses(
                                  "text-sm font-medium text-white",
                                  "dark:text-white"
                                )}>
                                  {getUserInitials(member)}
                                </span>
                              )}
                            </div>
                          ))}
                          {projectMembers.length > 3 && (
                            <div className={getThemeClasses(
                              "w-8 h-8 flex items-center justify-center px-2 py-1 rounded-full bg-gray-100 border border-gray-200 shadow-sm",
                              "dark:bg-gray-700 dark:border-gray-600"
                            )}
                              style={{ marginLeft: '-10px' }}>
                              <span className={getThemeClasses(
                                "text-xs font-medium text-gray-600",
                                "dark:text-gray-300"
                              )}>
                                +{projectMembers.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* GitHub Repository Button - Only for owners */}
                    {isOwner && projectRepository && (
                      <button
                        className={getThemeClasses(
                          "p-1.5 text-gray-500 hover:text-green-500 rounded-full hover:bg-gray-100 transition-colors",
                          "dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-700"
                        )}
                        title={projectRepository ? "Manage Repository" : "Link GitHub Repository"}
                        onClick={() => {
                          if (projectRepository) {
                            setShowRepositoryModal(true);
                          } else {
                            fetchUserRepositories();
                          }
                        }}
                      >
                        <FaGithub size={20} />
                      </button>
                    )}
                    {/* Project Settings moved to Tab bar */}
                  </div>
                </div>
              </div>
            </div>

            {/* Project Description - Mobile View */}
            <div className={getThemeClasses(
              'md:hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm space-y-4',
              'dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700/50 dark:shadow-none'
            )}>
              {/* Description Section */}
              <div className="flex items-start gap-3">
                <div className={getThemeClasses(
                  'flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center',
                  'dark:bg-blue-900/50'
                )}>
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={getThemeClasses(
                    'text-sm font-semibold text-blue-800 mb-2',
                    'dark:text-blue-300'
                  )}>
                    Project Description
                  </h3>
                  {project.Description ? (
                    <p className={getThemeClasses(
                      'text-sm text-blue-700 leading-relaxed break-words',
                      'dark:text-blue-200'
                    )}>
                      {project.Description}
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

              {/* Status and Team Section */}
              <div className="space-y-3">
                {/* Status Badges Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Project Status */}
                  {project && (
                    <div className="flex-shrink-0">
                      {getProjectStatusBadgeComponent(project.ProjectStatusID)}
                    </div>
                  )}

                  {/* Deadline Status */}
                  {project.DueDate && (
                    <div className="flex-shrink-0">
                      {(() => {
                        const status = getDeadlineStatusComponent(deadline);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-gradient-to-r ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                            <span className={`w-2 h-2 rounded-full ${status.dotColor} ${deadline !== 'Deadline Passed' && deadline !== 'No Deadline' ? 'animate-pulse' : ''}`}></span>
                            {status.text}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Team and GitHub Section */}
                <div className="flex items-center justify-between">
                  {/* Team Members */}
                  {projectMembers.length > 0 && (
                    <div className="flex items-center gap-1">
                      {projectMembers.slice(0, 3).map((member, idx) => (
                        <div
                          key={member._id}
                          className={getThemeClasses(
                            "w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden bg-purple-500",
                            "dark:border-gray-700"
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
                            <span className="text-xs font-medium text-white">
                              {getUserInitials(member)}
                            </span>
                          )}
                        </div>
                      ))}
                      {projectMembers.length > 3 && (
                        <div className={getThemeClasses(
                          "w-7 h-7 flex items-center justify-center px-1 py-0.5 rounded-full bg-gray-100 border border-gray-200 shadow-sm",
                          "dark:bg-gray-700 dark:border-gray-600"
                        )}
                          style={{ marginLeft: '-8px' }}>
                          <span className={getThemeClasses(
                            "text-xs font-medium text-gray-600",
                            "dark:text-gray-300"
                          )}>
                            +{projectMembers.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* GitHub Repository Button */}
                  {isOwner && projectRepository && (
                    <button
                      className={getThemeClasses(
                        "p-2 text-gray-500 hover:text-green-500 rounded-full hover:bg-gray-100 transition-colors",
                        "dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-700"
                      )}
                      title={projectRepository ? "Manage Repository" : "Link GitHub Repository"}
                      onClick={() => {
                        if (projectRepository) {
                          setShowRepositoryModal(true);
                        } else {
                          fetchUserRepositories();
                        }
                      }}
                    >
                      <FaGithub size={18} />
                    </button>
                  )}

                  {/* Generate Report Button */}
                  <button
                    className={getThemeClasses(
                      "p-2 text-gray-500 hover:text-green-500 rounded-full hover:bg-gray-100 transition-colors",
                      "dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-700"
                    )}
                    title="Generate AI Report"
                    onClick={() => setShowReportGenerator(true)}
                  >
                    <FaFileAlt size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className='w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mt-6'>
              {/* Add Team Dropdown */}
              {/* moved search to header */}
            </div>
            {/* Teams Assigned - Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
              <div className='lg:col-span-3'>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>Teams Assigned</h2>
                  {isOwner && (
                    <form onSubmit={(e) => { e.preventDefault(); if (selectedTeam) handleAddTeam(selectedTeam.TeamID); }} className="relative">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={getThemeClasses(
                            'border rounded-xl px-4 py-2 w-64 text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
                            'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
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
                              'px-3 py-2 text-sm text-white font-medium rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 disabled:opacity-50',
                              'dark:from-blue-600 dark:to-blue-700'
                            )}
                            title={selectedTeam ? 'Add selected team to project' : 'Select a team from dropdown'}
                          >
                            Add
                          </button>
                        )}
                      </div>
                      {isTeamInputFocused && filteredAvailableTeams.length > 0 && (
                        <div className="absolute top-full right-0 z-50 mt-1 w-[22rem]">
                          <ul className={getThemeClasses(
                            'border rounded-xl bg-white max-h-60 overflow-y-auto shadow-lg border-gray-200',
                            'dark:bg-gray-800 dark:border-gray-700'
                          )}>
                            {filteredAvailableTeams.map((team, index) => (
                              <li key={`${team.TeamID}-${index}`} className={getThemeClasses('px-4 py-2.5 border-b last:border-b-0 transition-colors duration-150', 'dark:border-gray-700')}>
                                <div className="flex items-center justify-between gap-2">
                                  <div
                                    className={getThemeClasses('flex-1 cursor-pointer rounded-lg p-2 hover:bg-blue-50', 'dark:hover:bg-blue-900/30')}
                                    onMouseEnter={(e) => {
                                      const el = e.currentTarget;
                                      el.style.backgroundColor = hexToRgba(team.TeamColor, theme === 'dark' ? 0.15 : 0.12) || '';
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
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={getThemeClasses('w-8 h-8 rounded-full flex items-center justify-center font-semibold flex-shrink-0', 'dark:bg-blue-900/50')}
                                        style={{ backgroundColor: hexToRgba(team.TeamColor, theme === 'dark' ? 0.12 : 0.2) }}
                                      >
                                        {(team.TeamName || '').split(' ').map(n => n[0]).join('')}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className={getThemeClasses('font-medium text-gray-900 truncate', 'dark:text-gray-100')}>
                                          {team.TeamName}
                                        </div>
                                        {team.TeamDescription && (
                                          <div className={getThemeClasses('text-sm text-gray-600 truncate', 'dark:text-gray-400')}>
                                            {team.TeamDescription}
                                          </div>
                                        )}
                                        <div className={getThemeClasses('text-xs text-gray-400 mt-1', 'dark:text-gray-500')}>
                                          Members: {Array.isArray(team.teamMembers) ? team.teamMembers.length : (team.memberCount ?? 0)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedTeam(team); handleAddTeam(team.TeamID); }}
                                    className={getThemeClasses('ml-2 p-2 text-sm text-blue-700 font-medium rounded-full transition-all duration-200 bg-blue-100 hover:bg-blue-600 hover:text-white shadow-sm', 'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800')}
                                  >
                                    <FaPlus size={14} />
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
                                'w-full mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-xl transition-colors duration-200',
                                'dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30'
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                                  <Link href={`/team/${team.TeamID}`} legacyBehavior>
                                    <a className={`${tableTextClasses} hover:text-blue-600 hover:underline transition-colors cursor-pointer block truncate`} title="View Team Details">
                                      {team?.TeamName || team.TeamID}
                                    </a>
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
                                <StatusPill status={team.IsActive ? 'Active' : 'Offline'} theme={theme} showPulseOnActive />
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-6">
                              {/* Members overlay */}
                              {team.teamMembers.length > 0 && (
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
                                        'w-7 h-7 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-[10px] font-semibold flex items-center justify-center',
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
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${team.IsActive
                                      ? getThemeClasses('bg-blue-100 text-blue-700 hover:bg-blue-200', 'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50')
                                      : getThemeClasses('bg-green-100 text-green-700 hover:bg-green-200', 'dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/50')}`}
                                    title={team.IsActive ? 'Revoke Access' : 'Grant Access'}
                                    disabled={toggling === team.TeamID}
                                  >
                                    <FaToggleOn size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRemovingTeam(team);
                                      setShowRemoveDialog(true);
                                    }}
                                    className={getThemeClasses(
                                      'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                      'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                    )}
                                    title="Remove Team"
                                    disabled={removing}
                                  >
                                    <FaTimes size={16} />
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
              <div className={`lg:col-span-2`}>
                <div className="flex justify-between mb-4">
                  <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>User Stories</h2>
                  <button
                    onClick={() => { setAddTaskTypeMode('userStory'); setIsAddTaskOpen(true); }}
                    className={getThemeClasses(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm',
                      'dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'
                    )}
                  >
                    <FaPlus size={14} />
                    Create
                  </button>
                </div>
                <div className={`overflow-x-auto ${tableContainerClasses}`}>
                  {userStories.length === 0 ? (
                    <div className={getThemeClasses(
                      'text-center py-8 text-gray-400',
                      'dark:text-gray-500'
                    )}>
                      No user stories for this project.
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
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
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <Link href={`/task/${story.TaskID}`} legacyBehavior>
                                    <a className={tableTextClasses + ' hover:text-blue-600 hover:underline transition-colors cursor-pointer'} title="View User Story Details">{story.Name}</a>
                                  </Link>
                                  {story.Description && (
                                    <span className={tableSecondaryTextClasses}>{story.Description}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className={`hidden md:table-cell py-3 px-4 ${tableSecondaryTextClasses}`}>
                              <span>{formatDateUTC(story.DueDate)}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getTaskStatusBadge(story.Status, theme === 'dark', getTaskStatusText(story.Status))}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditTask(story)}
                                  className={getThemeClasses(
                                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                                    'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                                  )}
                                  title="Edit User Story"
                                >
                                  <FaEdit size={14} />
                                </button>
                                <button
                                  onClick={() => confirmDeleteUserStory(story)}
                                  className={getThemeClasses(
                                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                    'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                  )}
                                  title="Delete User Story"
                                >
                                  <MdDelete size={18} />
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
                  <table className="w-full">
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
                        <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('name')} className="inline-flex items-center gap-1">
                            <span>Name</span>
                            {getTasksSortIcon('name')}
                          </button>
                        </th>
                        <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('assignedTo')} className="inline-flex items-center gap-1">
                            <span>Assigned To</span>
                            {getTasksSortIcon('assignedTo')}
                          </button>
                        </th>
                        <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('assignee')} className="inline-flex items-center gap-1">
                            <span>Assignee</span>
                            {getTasksSortIcon('assignee')}
                          </button>
                        </th>
                        <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('assignedDate')} className="inline-flex items-center">
                            <span>Date Assigned</span>
                            {getTasksSortIcon('assignedDate')}
                          </button>
                        </th>
                        <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('priority')} className="inline-flex items-center gap-1">
                            <span>Priority</span>
                            {getTasksSortIcon('priority')}
                          </button>
                        </th>
                        <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                          <button type="button" onClick={() => handleTasksSort('status')} className="inline-flex items-center gap-1">
                            <span>Status</span>
                            {getTasksSortIcon('status')}
                          </button>
                        </th>
                        <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasksSorted.map(task => {
                        // Get priority style for background color if task has TicketNumber
                        const getPriorityBackgroundColor = (priority) => {
                          const styles = {
                            'High': 'bg-red-50 dark:bg-red-900/10',
                            'Medium': 'bg-yellow-50 dark:bg-yellow-900/10',
                            'Low': 'bg-green-50 dark:bg-green-900/10'
                          };
                          return styles[priority] || '';
                        };

                        const ticketRowClasses = task.TicketNumber
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
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                  <button
                                    onClick={() => router.push(`/task/${task.TaskID}`)}
                                    className={getThemeClasses(
                                      'text-left hover:text-blue-600 hover:underline transition-colors cursor-pointer font-medium',
                                      'dark:hover:text-blue-400'
                                    )}
                                    title="Click to view task details"
                                  >
                                    {task.Name}
                                  </button>
                                  {getTaskTypeBadgeComponent(task.Type)}
                                </div>
                                <span className={getThemeClasses(
                                  'text-xs text-gray-500',
                                  'dark:text-gray-400'
                                )}>{task.Description}</span>
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
                            <td className="hidden md:table-cell py-3 px-4">
                              {task.Assignee && task.AssigneeDetails ? (
                                <div className="flex items-center gap-3">
                                  <div className={getThemeClasses(
                                    'w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-medium text-sm',
                                    'dark:from-green-600 dark:to-green-700'
                                  )}>
                                    {task.AssigneeDetails.fullName.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={tableTextClasses}>{task.AssigneeDetails.fullName} <span className={'text-xs'}>{isMe(task.Assignee) ? ' (You)' : ''}</span></span>
                                    {task.AssigneeDetails.teamName && (
                                      <span className={tableSecondaryTextClasses}>{task.AssigneeDetails.teamName}</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className={getThemeClasses(
                                    'w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-sm',
                                    'dark:bg-gray-700 dark:text-gray-400'
                                  )}>
                                    <span>NA</span>
                                  </div>
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
                            <td className="hidden md:table-cell py-3 px-4">
                              <div className="flex items-center gap-1.5">
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
                                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                                    'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                                  )}
                                  title="Edit Task"
                                >
                                  <FaEdit size={14} />
                                </button>
                                <button
                                  onClick={() => confirmDeleteTask(task)}
                                  className={getThemeClasses(
                                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                    'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                  )}
                                  title="Delete Task"
                                  disabled={removing}
                                >
                                  <MdDelete size={18} />
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
                <ProjectActivity projectId={projectId} activity={projectActivity} projectCreatedDate={project?.CreatedDate} />
              </div>
            )}
          </div>
        ) : activeTab === 'board' ? (
          <div>
            {/* Board Tab: Re-using global Kanban board */}
            <KanbanBoard projectId={projectId} selectedUserStoryProp={selectedUserStory} projectMembersProp={projectMembers} taskListProp={taskList} />
          </div>
        ) : activeTab === 'timeline' ? (
          <GanttChart tasks={taskList} userStories={userStories} project={project} />
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
                          <div className={`flex items-center ${indexx === 0 ? '' : 'mt-4'}`}>
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
                                    <th className={`py-3 px-4 tracking-wider hidden sm:table-cell w-1/6 ${getThemeClasses('border-b border-gray-200', 'border-gray-700')}`}>Assignee</th>
                                    <th className={`py-3 px-4 tracking-wider hidden sm:table-cell w-24 ${getThemeClasses('border-b border-gray-200', 'border-gray-700')}`}>Date Assigned</th>
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
                                                     className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                                                       item.IsCompleted 
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
                                        <td className={`px-4 hidden sm:table-cell ${item.isSubtask ? 'py-2' : 'py-3'} w-1/6`}>
                                          {item.Assignee && item.AssigneeDetails ? (
                                            <div className="flex items-center gap-3">
                                              {!item.isSubtask && (
                                                <div className={getThemeClasses(
                                                  'w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-medium text-sm',
                                                  'dark:from-green-600 dark:to-green-700'
                                                )}>
                                                  {item.AssigneeDetails.fullName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                              )}
                                              <div className="flex flex-col">
                                                <span className={getThemeClasses('text-sm font-medium text-gray-900', 'dark:text-gray-100')}>
                                                  {item.AssigneeDetails.fullName} <span className={'text-xs'}>{isMe(item.Assignee) ? ' (You)' : ''}</span>
                                                </span>
                                                {item.AssigneeDetails.teamName && (
                                                  <span className={getThemeClasses('text-xs text-gray-500', 'dark:text-gray-400')}>{item.AssigneeDetails.teamName}</span>
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
        ) : activeTab === 'repo' && projectRepository?.connected ? (
          <div className={getThemeClasses("bg-white rounded-xl shadow p-6", "dark:bg-transparent")}>
            <div className="flex items-center gap-2 mb-6">
              <FaGithub size={22} className={getThemeClasses("text-gray-800", "dark:text-gray-100")} />
              <h2 className={getThemeClasses("text-xl font-semibold text-gray-900", "dark:text-gray-100")}>Repository Activity</h2>
            </div>

            {/* Commits and Issues Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Commits Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FaCode size={18} className={getThemeClasses("text-gray-600", "dark:text-gray-400")} />
                    <h3 className={getThemeClasses("text-lg font-semibold text-gray-900", "dark:text-gray-100")}>Commits</h3>
                  </div>
                  {commits.length > 0 && (
                    <div className={getThemeClasses("text-sm text-gray-500", "dark:text-gray-400")}>
                      Page {commitsPage} of {commitsTotalPages}
                    </div>
                  )}
                </div>
                {commitsLoading && commits.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className={getThemeClasses("ml-3 text-sm text-gray-500", "dark:text-gray-400")}>Loading commits...</span>
                  </div>
                ) : commits.length === 0 ? (
                  <div className={getThemeClasses("text-center py-8 text-gray-500", "dark:text-gray-400")}>No commits found.</div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {Object.entries(groupCommitsByDate(commits)).map(([date, dateCommits]) => (
                        <div key={date} className="relative">
                          {/* Date Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={getThemeClasses("flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full", "dark:bg-blue-400")}></div>
                            <h4 className={getThemeClasses("text-sm font-semibold text-gray-700", "dark:text-gray-300")}>{date}</h4>
                            <div className={getThemeClasses("flex-1 h-px bg-gray-200", "dark:bg-gray-700")}></div>
                          </div>

                          {/* Timeline */}
                          <div className="relative">
                            {/* Timeline line */}
                            <div className={getThemeClasses("absolute left-1 top-0 bottom-0 w-px bg-gray-200", "dark:bg-gray-700")}></div>

                            {/* Commits */}
                            <div className="space-y-3">
                              {dateCommits.map((commit, index) => (
                                <div key={commit.sha} className="relative pl-6">
                                  {/* Timeline dot */}
                                  <div className={getThemeClasses("absolute left-0 top-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white", "dark:bg-blue-400 dark:border-gray-900")}></div>

                                  {/* Commit card */}
                                  <div className={getThemeClasses("bg-gray-50 rounded-lg p-3 border border-gray-100", "dark:bg-transparent dark:border-gray-700")}>
                                    <div className="flex items-start gap-2 mb-2">
                                      <a
                                        href={commit.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={getThemeClasses("font-mono text-blue-600 hover:underline text-xs flex-shrink-0", "dark:text-blue-400")}
                                      >
                                        {getShortSha(commit.sha)}
                                      </a>
                                      <span className={getThemeClasses("text-gray-900 font-medium text-sm line-clamp-2", "dark:text-gray-100")} title={commit.message}>
                                        {commit.message.split('\n')[0]}
                                      </span>
                                    </div>

                                    <div className={getThemeClasses("flex items-center justify-between text-xs text-gray-500", "dark:text-gray-400")}>
                                      <div className="flex items-center gap-2">
                                        <span>by {commit.author.name}</span>
                                        <span>•</span>
                                        <span>{formatTimeAgo(commit.author.date)}</span>
                                      </div>

                                      <a
                                        href={commit.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={getThemeClasses("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white text-gray-700 hover:bg-blue-50 transition-colors border border-gray-200", "dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-blue-900/30 dark:border-gray-600")}
                                      >
                                        <FaGithub size={10} /> View
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {commitsTotalPages > 1 && (
                      <Pagination
                        currentPage={commitsPage}
                        totalPages={commitsTotalPages}
                        onPageChange={goToCommitsPage}
                        onNext={nextCommitsPage}
                        onPrev={prevCommitsPage}
                        loading={commitsLoading}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Issues Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FaQuestionCircle size={18} className={getThemeClasses("text-gray-600", "dark:text-gray-400")} />
                  <h3 className={getThemeClasses("text-lg font-semibold text-gray-900", "dark:text-gray-100")}>Issues</h3>
                </div>
                {issuesLoading && issues.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className={getThemeClasses("ml-3 text-sm text-gray-500", "dark:text-gray-400")}>Loading issues...</span>
                  </div>
                ) : issues.length === 0 ? (
                  <div className={getThemeClasses("text-center py-8 text-gray-500", "dark:text-gray-400")}>No issues found.</div>
                ) : (
                  <>
                    <ul className={getThemeClasses("divide-y divide-gray-200", "dark:divide-gray-700")}>
                      {issues.map(issue => (
                        <li key={issue.id} className="py-3 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={getThemeClasses("text-gray-900 font-medium text-sm truncate", "dark:text-gray-100")} title={issue.title}>#{issue.number} {issue.title}</span>
                            {getIssueStatusBadge(issue.state)}
                          </div>
                          <div className={getThemeClasses("flex items-center gap-2 text-xs text-gray-500", "dark:text-gray-400")}>
                            <span>by {issue.user.login}</span>
                            <span>•</span>
                            <span>{formatIssueDate(issue.created_at)}</span>
                            {issue.comments > 0 && (
                              <>
                                <span>•</span>
                                <span>{issue.comments} comments</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className={getThemeClasses("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-blue-50 transition-colors", "dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-blue-900/30")}>
                              <FaGithub size={12} /> View
                            </a>
                            {issue.labels.length > 0 && (
                              <div className="flex gap-1">
                                {issue.labels.slice(0, 2).map(label => (
                                  <span key={label.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `#${label.color}`, color: parseInt(label.color, 16) > 0x888888 ? '#000' : '#fff' }}>
                                    {label.name}
                                  </span>
                                ))}
                                {issue.labels.length > 2 && (
                                  <span className={getThemeClasses("text-xs text-gray-500", "dark:text-gray-400")}>+{issue.labels.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {hasMoreIssues && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={loadMoreIssues}
                          disabled={issuesLoading}
                          className={getThemeClasses("px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60", "dark:bg-blue-700 dark:hover:bg-blue-800")}
                        >
                          {issuesLoading ? 'Loading...' : 'Load More'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'knowledge' && currentUser?.role === 'Admin' ? (
          <RAGManagement organizationId={project?.OrganizationID} />
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
                    maxLength={100}
                    rows={3}
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

                {/* GitHub Repository Selection/Information */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 min-w-[120px] pt-2">
                    <FaGithub className={getThemeClasses(
                      'text-gray-500',
                      'text-white'
                    )} size={16} />
                    <label className={getThemeClasses(
                      'text-sm font-medium text-gray-700',
                      'text-sm font-medium text-white'
                    )}>
                      Repository
                    </label>
                  </div>
                  {/* GitHub Repository Information */}
                  <div className="flex-1">
                    {projectRepository ? (
                      <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800/30 border-gray-600' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex flex-col sm:flex-row justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                              {projectRepository.repositoryFullName}
                            </h4>
                            {projectRepository.repositoryDescription && (
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                                {projectRepository.repositoryDescription}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              {projectRepository.repositoryLanguage && (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
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
                          </div>
                          <div className="w-full flex flex-row justify-end sm:items-end sm:flex-col mt-4 sm:mt-0 gap-2">
                            <a
                              href={projectRepository.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'}`}
                            >
                              <FaLink size={10} />
                              View
                            </a>
                            {isOwner && (
                              <div className="flex flex-row sm:flex-col items-end gap-2 relative">
                                <button
                                  type="button"
                                  onClick={handleUnlinkRepository}
                                  disabled={unlinkingRepository}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                >
                                  {unlinkingRepository ? <FaSpinner className="animate-spin" size={10} /> : <FaUnlink size={10} />}
                                  Unlink
                                </button>

                                <div className="relative" data-repository-dropdown>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowRepositoryList(true);
                                      if (userRepositories.length === 0) fetchUserRepositories();
                                    }}
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                  >
                                    <FaGithub size={10} />
                                    Change
                                  </button>

                                  {showRepositoryList && (
                                    <div className="absolute top-full right-0 mt-2 w-80 z-50">
                                      <div className={`rounded-lg shadow-lg border ${theme === 'dark' ? 'bg-gray-100 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div className="p-3">
                                          <div className="flex justify-between items-center mb-3">
                                            <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                              Select Repository
                                            </h4>
                                            <button
                                              onClick={() => setShowRepositoryList(false)}
                                              className={`p-1 rounded hover:bg-opacity-10 ${theme === 'dark' ? 'hover:bg-white text-gray-400' : 'hover:bg-gray-900 text-gray-500'}`}
                                            >
                                              <FaTimes size={12} />
                                            </button>
                                          </div>

                                          {repositoryLoading ? (
                                            <div className="flex items-center justify-center py-4">
                                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                              <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
                                            </div>
                                          ) : userRepositories.length > 0 ? (
                                            <div className="max-h-60 overflow-y-auto">
                                              <div className="space-y-2">
                                                {userRepositories.map((repo) => (
                                                  <button
                                                    key={repo.id}
                                                    type="button"
                                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${theme === 'dark' ? 'border-gray-700 hover:border-blue-600 hover:bg-gray-700/50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                                                    onClick={() => handleLinkRepository(repo)}
                                                  >
                                                    <div className="flex items-start gap-2">
                                                      <FaGithub className="text-green-600 mt-0.5" size={12} />
                                                      <div className="flex-1 min-w-0">
                                                        <div className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                          {repo.full_name}
                                                        </div>
                                                        {repo.description && (
                                                          <div className={`text-xs truncate mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                            {repo.description}
                                                          </div>
                                                        )}
                                                        <div className="mt-1 flex items-center gap-2 text-xs">
                                                          {repo.language && (
                                                            <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{repo.language}</span>
                                                          )}
                                                          <span className={`${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>★ {repo.stargazers_count}</span>
                                                          <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>⑂ {repo.forks_count}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className={`text-center py-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                              No repositories found
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        {isOwner && (
                          <div className="relative" data-repository-dropdown>
                            <button
                              type="button"
                              onClick={() => {
                                setShowRepositoryList(true);
                                if (userRepositories.length === 0) fetchUserRepositories();
                              }}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            >
                              <FaGithub size={14} />
                              Select GitHub Repository
                            </button>

                            {showRepositoryList && (
                              <div className="fixed sm:absolute left-4 right-4 sm:left-0 sm:right-auto sm:w-80 top-1/2 sm:top-full sm:mt-2 transform -translate-y-1/2 sm:translate-y-0 sm:transform-none z-50">
                                <div className={`rounded-lg shadow-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                  <div className="p-3">
                                    <div className="flex justify-between items-center mb-3">
                                      <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Select Repository
                                      </h4>
                                      <button
                                        onClick={() => setShowRepositoryList(false)}
                                        className={`p-1 rounded hover:bg-opacity-10 ${theme === 'dark' ? 'hover:bg-white text-gray-400' : 'hover:bg-gray-900 text-gray-500'}`}
                                      >
                                        <FaTimes size={12} />
                                      </button>
                                    </div>

                                    {repositoryLoading ? (
                                      <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
                                      </div>
                                    ) : userRepositories.length > 0 ? (
                                      <div className="max-h-96 overflow-y-auto">
                                        <div className="space-y-2">
                                          {userRepositories.map((repo) => (
                                            <button
                                              key={repo.id}
                                              type="button"
                                              className={`w-full text-left p-3 rounded-lg border transition-colors ${theme === 'dark' ? 'border-gray-700 hover:border-blue-600 hover:bg-gray-700/50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                                              onClick={() => handleLinkRepository(repo)}
                                            >
                                              <div className="flex items-start gap-2">
                                                <FaGithub className="text-green-600 mt-0.5" size={12} />
                                                <div className="flex-1 min-w-0">
                                                  <div className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {repo.full_name}
                                                  </div>
                                                  {repo.description && (
                                                    <div className={`text-xs truncate mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                      {repo.description}
                                                    </div>
                                                  )}
                                                  <div className="mt-1 flex items-center gap-2 text-xs">
                                                    {repo.language && (
                                                      <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{repo.language}</span>
                                                    )}
                                                    <span className={`${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>★ {repo.stargazers_count}</span>
                                                    <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>⑂ {repo.forks_count}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className={`text-center py-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        No repositories found
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
      </div>

      {/* Report Generator Modal */}
      {showReportGenerator && (
        <ReportGenerator
          projectId={projectId}
          projectName={project?.Name}
          onClose={() => setShowReportGenerator(false)}
        />
      )}
    </>
  );
}

export default ProjectDetailsPage;