import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FaCheckCircle, FaClock, FaEdit, FaProjectDiagram, FaCalendarAlt, FaChevronDown, FaPlus, FaTasks, FaImage, FaMicrophone, FaPaperclip, FaTag, FaPaperPlane, FaReply, FaTrash, FaTimes, FaCheck, FaCodeBranch, FaGitAlt } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import TaskCollaborationIndicator from '../../components/shared/TaskCollaborationIndicator';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { useToast } from '../../context/ToastContext';
import { taskService, taskDetailsService, commentService, githubService } from '../../services/api';
import TaskDetailsSkeleton from '../../components/skeletons/TaskDetailsSkeleton';
import { statusMap, statusIcons, statusColors, useThemeClasses } from '../../components/kanban/kanbanUtils';
import { connectSocket, subscribe, getSocket } from '../../services/socket';
import TaskAttachments from '../../components/task/TaskAttachments';
import TaskComments from '../../components/task/TaskComments';
import SubtaskList from '../../components/task/SubtaskList';

import CustomModal from '../../components/shared/CustomModal';
import { getPriorityBadge, getTaskTypeBadge } from '../../components/task/TaskTypeBadge';
import AddTaskModal from '../../components/shared/AddTaskModal';
import CustomDropdown from '../../components/shared/CustomDropdown';

const TaskDetailsPage = () => {
    const router = useRouter();
    const { taskId } = router.query;
    const { theme } = useTheme();
    const { userDetails, formatTimeAgo } = useGlobal();
    const { showToast } = useToast();
    const getThemeClasses = useThemeClasses();

    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [error, setError] = useState('');
    const [subtasks, setSubtasks] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [comments, setComments] = useState([]);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [projectMembers, setProjectMembers] = useState([]);
    const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
    const [assigningMember, setAssigningMember] = useState(false);
    const [taskActivity, setTaskActivity] = useState([]);
    const [activityPage, setActivityPage] = useState(1);
    const [activityTotalPages, setActivityTotalPages] = useState(1);
    const [activityLoading, setActivityLoading] = useState(false);
    const [editingTaskName, setEditingTaskName] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const editTaskNameInputRef = useRef(null);
    const taskNameSpanRef = useRef(null);

    // Git Link state variables
    const [isGitLinkModalOpen, setIsGitLinkModalOpen] = useState(false);
    const [gitLinkType, setGitLinkType] = useState('Commit');
    const [gitCommitSha, setGitCommitSha] = useState('');
    const [gitComment, setGitComment] = useState('');
    const [gitCommitMessage, setGitCommitMessage] = useState('');
    const [gitSubmitting, setGitSubmitting] = useState(false);
    const [gitCommitsList, setGitCommitsList] = useState([]);
    const [gitCommitsLoading, setGitCommitsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [userStoryTasks, setUserStoryTasks] = useState([]);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    // Mobile specific comment states & helpers
    const [mobileCommentText, setMobileCommentText] = useState('');
    const [mobileSubmitting, setMobileSubmitting] = useState(false);

    const getMobileDueDateText = (dueDate) => {
        if (!dueDate) return 'Today 11:59 PM';
        const date = new Date(dueDate);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        if (isToday) {
            return `Today ${timeStr}`;
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();
        if (isTomorrow) {
            return `Tomorrow ${timeStr}`;
        }

        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
    };

    const handleMobileCommentSubmit = async () => {
        if (!mobileCommentText.trim() || mobileSubmitting) return;
        setMobileSubmitting(true);
        try {
            await commentService.addComment(
                task.TaskID,
                userDetails?.fullName || userDetails?.username || 'User',
                mobileCommentText.trim()
            );
            setMobileCommentText('');
            showToast('Comment posted successfully!', 'success');
        } catch (err) {
            console.error('Failed to post mobile comment:', err);
            showToast('Failed to post comment', 'error');
        } finally {
            setMobileSubmitting(false);
        }
    };

    const renderCommentContent = (content) => {
        if (!content) return '';
        const mentionRegex = /@([A-Za-z_]+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }
            const displayName = match[1].replace(/_/g, ' ');
            parts.push(
                <span key={match.index} className="font-bold text-blue-600 bg-blue-50 px-1 rounded dark:text-blue-400 dark:bg-blue-900/30">
                    @{displayName}
                </span>
            );
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }
        return parts.length > 0 ? parts : content;
    };

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    const handleEditComment = async (commentId) => {
        if (!editingCommentText.trim()) return;
        try {
            await commentService.updateComment(commentId, { Content: editingCommentText.trim() });
            setEditingCommentId(null);
            setEditingCommentText('');
            showToast('Comment updated successfully', 'success');
        } catch (err) {
            console.error('Failed to update comment:', err);
            showToast('Failed to update comment', 'error');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (confirm('Are you sure you want to delete this comment?')) {
            try {
                await commentService.deleteComment(commentId);
                showToast('Comment deleted successfully', 'success');
            } catch (err) {
                console.error('Failed to delete comment:', err);
                showToast('Failed to delete comment', 'error');
            }
        }
    };

    // SWR-based query for dynamic task details
    const { data: fullTaskDetails, error: fetchError } = useSWR(
        taskId && typeof taskId === 'string' && taskId.trim() !== '' ? `/task-details/${taskId}` : null,
        () => taskDetailsService.getFullTaskDetails(taskId),
        {
            revalidateOnFocus: false,
            dedupingInterval: 5000,
        }
    );

    const loading = !fullTaskDetails && !fetchError && !!taskId;

    // Sync SWR data with local states
    useEffect(() => {
        if (fullTaskDetails) {
            setTask(fullTaskDetails.task);
            setProject(fullTaskDetails.project);
            setProjectMembers(fullTaskDetails.projectMembers || []);
            setSubtasks(fullTaskDetails.subtasks);
            setAttachments(fullTaskDetails.attachments);
            setComments(fullTaskDetails.comments);
            setUserStoryTasks(fullTaskDetails.userStoryTasks || []);
        }
    }, [fullTaskDetails]);

    // Handle fetching error states
    useEffect(() => {
        if (fetchError) {
            console.error('Error fetching task details:', fetchError);
            setError('Failed to fetch task details');
            showToast('Failed to fetch task details', 'error');
        }
    }, [fetchError]);

    // Manage WebSocket presence rooms
    useEffect(() => {
        if (taskId) {
            connectSocket();
            try { getSocket().emit('task.join', { taskId }); } catch (_) { }
        }
        return () => {
            if (taskId) {
                try { getSocket().emit('task.leave', { taskId }); } catch (_) { }
            }
        };
    }, [taskId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownOpen && !event.target.closest('.status-dropdown')) {
                setStatusDropdownOpen(false);
            }
            if (memberDropdownOpen && !event.target.closest('.member-dropdown')) {
                setMemberDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [statusDropdownOpen, memberDropdownOpen]);

    useEffect(() => {
        if (!editingTaskName) return;
        const handleClickOutside = (event) => {
            if (editTaskNameInputRef.current && !editTaskNameInputRef.current.contains(event.target)) {
                setEditingTaskName(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingTaskName]);

    // Socket subscriptions for task details
    useEffect(() => {
        if (!taskId) return;
        const offTaskUpdated = subscribe('task.updated', (payload) => {
            const { data } = payload || {};
            if (!data) return;
            if (data.task && data.task.TaskID === taskId) {
                setTask(prev => ({ ...prev, ...data.task }));
            } else if (data.taskId === taskId) {
                setTask(prev => ({ ...prev, ...(data.changes || {}) }));
            }
        });
        // Also react to project-level kanban status updates for redundancy
        const offKanbanStatus = subscribe('kanban.task.status.updated', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setTask(prev => ({ ...prev, Status: data.status }));
        });
        const offKanbanUpdated = subscribe('kanban.task.updated', (payload) => {
            const { data } = payload || {};
            if (!data || !data.task || data.task.TaskID !== taskId) return;
            setTask(prev => ({ ...prev, ...data.task }));
        });
        const offSubCreated = subscribe('task.subtask.created', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setSubtasks(prev => [...prev, data.subtask]);
        });
        const offSubUpdated = subscribe('task.subtask.updated', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setSubtasks(prev => prev.map(s => s.SubtaskID === data.subtask.SubtaskID ? data.subtask : s));
        });
        const offSubDeleted = subscribe('task.subtask.deleted', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setSubtasks(prev => prev.filter(s => s.SubtaskID !== data.subtaskId));
        });
        const offCommentCreated = subscribe('task.comment.created', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setComments(prev => [...prev, data.comment]);
        });
        const offCommentUpdated = subscribe('task.comment.updated', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setComments(prev => prev.map(c => c.CommentID === data.comment.CommentID ? data.comment : c));
        });
        const offCommentDeleted = subscribe('task.comment.deleted', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setComments(prev => prev.filter(c => c.CommentID !== data.commentId));
        });
        const offAttachAdded = subscribe('task.attachment.added', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setAttachments(prev => [data.attachment, ...prev]);
        });
        const offAttachRemoved = subscribe('task.attachment.removed', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setAttachments(prev => prev.filter(a => a.AttachmentID !== data.attachmentId));
        });
        // React to project-level assignment events to keep AssignedTo and Status in sync
        const offAssigned = subscribe('kanban.task.assigned', (payload) => {
            const { data } = payload || {};
            if (!data || data.taskId !== taskId) return;
            setTask(prev => ({ ...prev, AssignedTo: data.assignedTo, Status: data.status }));
        });
        return () => {
            offTaskUpdated && offTaskUpdated();
            offKanbanStatus && offKanbanStatus();
            offKanbanUpdated && offKanbanUpdated();
            offSubCreated && offSubCreated();
            offSubUpdated && offSubUpdated();
            offSubDeleted && offSubDeleted();
            offCommentCreated && offCommentCreated();
            offCommentUpdated && offCommentUpdated();
            offCommentDeleted && offCommentDeleted();
            offAttachAdded && offAttachAdded();
            offAttachRemoved && offAttachRemoved();
            offAssigned && offAssigned();
        };
    }, [taskId]);

    const getStatusInfo = (statusCode) => {
        const statusName = statusMap[statusCode] || 'Unknown';
        const statusIcon = statusIcons[statusCode];
        const statusStyle = statusColors[statusCode];
        return { statusName, statusIcon, statusStyle };
    };



    const formatActivityDisplay = (activity) => {
        if (activity.type === 'task_assign' && activity.metadata) {
            const { assignedByName, assignedToName } = activity.metadata;
            if (assignedByName && assignedToName) {
                return `${assignedByName} assigned this task to ${assignedToName}`;
            }
        }
        return activity.details || activity.description || `${activity.type} activity`;
    };

    const handleDeleteTask = async () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteTask = async () => {
        setDeleting(true);
        try {
            await taskService.deleteTask(taskId);
            showToast('Task deleted successfully', 'success');
            router.push(`/project/${task.ProjectID}`);
        } catch (err) {
            showToast('Failed to delete task', 'error');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            const oldStatus = task.Status;
            await taskService.updateTaskStatus(taskId, newStatus, userDetails?._id);
            setTask(prev => ({ ...prev, Status: newStatus }));
            setStatusDropdownOpen(false);
            showToast('Task status updated successfully', 'success');
            // Optimistically update the history table with full details
            const oldStatusName = statusMap[oldStatus] || oldStatus;
            const newStatusName = statusMap[newStatus] || newStatus;
            setTaskActivity(prev => [
                {
                    _id: `local-${Date.now()}`,
                    type: 'task_update',
                    status: 'success',
                    details: `Updated ${task.Type} "${task.Name}" status from ${oldStatusName} to ${newStatusName}`,
                    metadata: {
                        oldStatus: oldStatusName,
                        newStatus: newStatusName,
                        user: userDetails?._id,
                        taskId: taskId
                    },
                    timestamp: new Date().toISOString()
                },
                ...prev
            ]);
        } catch (err) {
            showToast('Failed to update task status', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleMemberAssignment = async (memberId) => {
        setAssigningMember(true);
        try {
            // If memberId is null, unassign the task
            // If memberId is 'self', use current user's ID
            // Otherwise use the provided memberId
            const assigneeId = memberId === 'self' ? userDetails?._id : memberId;

            const response = await taskService.assignTask(taskId, assigneeId);

            // Update task with the response data which includes the new assignee details
            setTask(prev => ({
                ...prev,
                AssignedTo: assigneeId,
                AssignedToDetails: response.AssignedToDetails,
                Status: assigneeId ? 2 : 1 // Update status based on assignment
            }));

            // Update task activity from the response
            if (response.taskActivity) {
                setTaskActivity(response.taskActivity);
            }

            setMemberDropdownOpen(false);
            const actionMessage = assigneeId ?
                (memberId === 'self' ? 'Task assigned to yourself' : 'Task assigned successfully') :
                'Task unassigned successfully';
            showToast(actionMessage, 'success');
        } catch (err) {
            showToast('Failed to assign task', 'error');
        } finally {
            setAssigningMember(false);
        }
    };

    const fetchTaskActivity = async (page = 1) => {
        setActivityLoading(true);
        try {
            const { activity, totalPages } = await taskService.getTaskActivity(taskId, page, 5);
            setTaskActivity(activity);
            setActivityTotalPages(totalPages);
        } catch (err) {
            // handle error
        } finally {
            setActivityLoading(false);
        }
    };


    // Helper function to get user initials
    const getUserInitials = (fullName) => {
        if (!fullName) return '?';
        return fullName
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Helper function to get task progress percentage
    const getTaskProgressPercentage = (status) => {
        const statusEntries = Object.entries(statusMap);
        const currentIndex = statusEntries.findIndex(([statusCode]) => parseInt(statusCode) === status);
        if (currentIndex === -1) return 0;

        const totalSteps = statusEntries.length;
        if (currentIndex === totalSteps - 1) return 100;

        // Calculate percentage to stop at the center of the current status circle
        // For 6 statuses: 0%, 16.67%, 33.33%, 50%, 66.67%, 83.33%
        // We want to stop at the center of the current status, not extend beyond it
        const progressPerStep = 100 / totalSteps;
        const progressToCurrentStep = (currentIndex + 0.7) * progressPerStep; // +0.7 to stop at center

        return Math.round(progressToCurrentStep);
    };

    // Helper function to get progress steps based on available statuses
    const getProgressSteps = () => {
        return Object.entries(statusMap).map(([statusCode, statusName]) => {
            const statusCodeInt = parseInt(statusCode);
            const statusInfo = getStatusInfo(statusCodeInt);

            // Map status codes to appropriate icons
            let icon;
            if (statusName.toLowerCase().includes('not started') || statusName.toLowerCase().includes('pending')) {
                icon = <FaClock size={16} />;
            } else if (statusName.toLowerCase().includes('progress') || statusName.toLowerCase().includes('working')) {
                icon = <FaProjectDiagram size={16} />;
            } else if (statusName.toLowerCase().includes('review')) {
                icon = <FaEdit size={16} />;
            } else if (statusName.toLowerCase().includes('test')) {
                icon = <FaCheckCircle size={16} />;
            } else if (statusName.toLowerCase().includes('complete') || statusName.toLowerCase().includes('done')) {
                icon = <FaCheckCircle size={16} />;
            } else {
                // Default icon for unknown statuses
                icon = <FaProjectDiagram size={16} />;
            }

            return {
                status: statusCodeInt,
                label: statusName,
                icon: icon
            };
        });
    };

    // Helper function to check if a step is completed
    const isStepCompleted = (stepStatus, currentStatus) => {
        const statusEntries = Object.entries(statusMap);
        const stepIndex = statusEntries.findIndex(([statusCode]) => parseInt(statusCode) === stepStatus);
        const currentIndex = statusEntries.findIndex(([statusCode]) => parseInt(statusCode) === currentStatus);

        return stepIndex < currentIndex;
    };

    useEffect(() => {
        if (taskId) fetchTaskActivity(activityPage);
        // eslint-disable-next-line
    }, [taskId, activityPage]);

    const handleEditTaskName = () => {
        setEditingTaskName(true);
        setNewTaskName(task.Name);
    };

    const handleSaveTaskName = async () => {
        if (!newTaskName.trim() || newTaskName === task.Name) {
            setEditingTaskName(false);
            return;
        }
        try {
            await taskService.updateTask(task.TaskID, { Name: newTaskName });
            setTask(prev => ({ ...prev, Name: newTaskName }));
            showToast('Task name updated', 'success');
        } catch (err) {
            showToast('Failed to update task name', 'error');
        } finally {
            setEditingTaskName(false);
        }
    };

    const handleFindCommits = async () => {
        if (!project) return;
        setGitCommitsLoading(true);
        try {
            const data = await githubService.getProjectCommits(project.ProjectID || project._id);
            setGitCommitsList(data.commits || []);
            if ((data.commits || []).length === 0) {
                showToast('No commits found in the repository', 'info');
            }
        } catch (err) {
            console.error('Error finding commits:', err);
            showToast('Failed to load commits from GitHub', 'error');
        } finally {
            setGitCommitsLoading(false);
        }
    };

    const handleFindBranches = async () => {
        if (!project) return;
        setGitCommitsLoading(true);
        try {
            const data = await githubService.getProjectBranches(project.ProjectID || project._id);
            setGitCommitsList(data.branches || []);
            if ((data.branches || []).length === 0) {
                showToast('No branches found in the repository', 'info');
            }
        } catch (err) {
            console.error('Error finding branches:', err);
            showToast('Failed to load branches from GitHub', 'error');
        } finally {
            setGitCommitsLoading(false);
        }
    };

    const handleFindPullRequests = async () => {
        if (!project) return;
        setGitCommitsLoading(true);
        try {
            const data = await githubService.getProjectPullRequests(project.ProjectID || project._id);
            setGitCommitsList(data.pulls || []);
            if ((data.pulls || []).length === 0) {
                showToast('No pull requests found in the repository', 'info');
            }
        } catch (err) {
            console.error('Error finding pull requests:', err);
            showToast('Failed to load pull requests from GitHub', 'error');
        } finally {
            setGitCommitsLoading(false);
        }
    };

    const handleSubmitGitLink = async (e) => {
        e?.preventDefault();
        if (!gitCommitSha) {
            showToast('Commit SHA is required', 'error');
            return;
        }

        setGitSubmitting(true);
        try {
            const repoFullName = project?.githubRepository?.repositoryFullName || 'Unknown Repository';
            const res = await taskDetailsService.addGitLink(taskId, {
                linkType: gitLinkType,
                repository: repoFullName,
                commitSha: gitCommitSha,
                comment: gitComment,
                commitMessage: gitCommitMessage
            });

            if (res.success) {
                setTask(prev => ({ ...prev, gitLinks: res.gitLinks }));
                showToast('Git link added successfully', 'success');
                // Reset form
                setGitCommitSha('');
                setGitComment('');
                setGitCommitMessage('');
                setGitCommitsList([]);
                setIsGitLinkModalOpen(false);
            }
        } catch (err) {
            console.error('Error adding git link:', err);
            showToast(err.error || 'Failed to add git link', 'error');
        } finally {
            setGitSubmitting(false);
        }
    };

    const handleDeleteGitLink = async (linkId) => {
        if (!window.confirm('Are you sure you want to remove this git link?')) return;
        try {
            const res = await taskDetailsService.deleteGitLink(taskId, linkId);
            if (res.success) {
                setTask(prev => ({ ...prev, gitLinks: res.gitLinks }));
                showToast('Git link removed successfully', 'success');
            }
        } catch (err) {
            console.error('Error removing git link:', err);
            showToast('Failed to remove git link', 'error');
        }
    };

    const handleAddTask = async (taskData) => {
        try {
            // Set ParentID to current user story's TaskID and always set ProjectID_FK
            const newTask = await taskService.addTaskDetails({ ...taskData, ParentID: task.TaskID, ProjectID_FK: task.ProjectID_FK }, 'fromProject');
            setUserStoryTasks(prev => [...prev, newTask]);

            const typeLabel = newTask.Type === 'User Story' ? 'User Story' : 'Task';
            showToast(`${typeLabel} added successfully!`, 'success', 5000, {
                description: `${typeLabel} "${newTask?.Name || taskData?.Name || ''}" has been created.`,
                action: {
                    label: 'View',
                    onClick: () => router.push(`/task/${newTask.TaskID}`)
                }
            });
            setShowAddTaskModal(false);
        } catch (err) {
            showToast('Failed to add task', 'error');
        }
    };

    if (loading) {
        return (
            <TaskDetailsSkeleton />
        );
    }

    if (error || !task) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className={getThemeClasses(
                        "text-red-500 text-2xl mb-4 font-semibold",
                        "dark:text-red-400"
                    )}>Task not found</div>
                    <Link href="/dashboard" className={getThemeClasses(
                        "text-blue-600 hover:text-blue-800 font-medium",
                        "dark:text-blue-400 dark:hover:text-blue-300"
                    )}>
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(task.Status);

    return (
        <>
            <Head>
                <title>{task.TicketNumber ? `${task.TicketNumber} - ${task.Name}` : task.Name}</title>
            </Head>
            <div className="mx-auto">
                {/* Mobile View */}
                <div className="lg:hidden space-y-2 pb-28 px-1">
                    {/* Title */}
                    <div className="pt-2">
                        <h1 className={getThemeClasses(
                            "text-2xl font-bold text-gray-900 leading-tight",
                            "dark:text-white"
                        )}>
                            {task.TicketNumber ? `${task.TicketNumber} - ` : ''}{task.Name}
                        </h1>
                    </div>

                    {/* Metadata Card */}
                    <div className={getThemeClasses(
                        "bg-gray-50/80 border border-gray-100 rounded-2xl p-4 grid grid-cols-3 gap-4 shadow-sm",
                        "dark:bg-[#202024]/40 dark:border-[#2b2b30]"
                    )}>
                        {/* Members */}
                        <div>
                            <span className={getThemeClasses("text-xs font-semibold text-gray-500 block mb-2", "dark:text-gray-400")}>
                                Members:
                            </span>
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                                {projectMembers.length > 0 ? (
                                    <>
                                        {projectMembers.slice(0, 3).map((member, idx) => (
                                            <div
                                                key={member._id || idx}
                                                className={getThemeClasses(
                                                    "inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-[9px] flex-shrink-0 shadow-sm",
                                                    "dark:ring-[#1a1a1e] dark:from-blue-600 dark:to-blue-700"
                                                )}
                                                title={member.fullName}
                                            >
                                                {getUserInitials(member.fullName)}
                                            </div>
                                        ))}
                                        {projectMembers.length > 3 && (
                                            <div className={getThemeClasses(
                                                "flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[9px] font-semibold text-gray-500 ring-2 ring-white shadow-sm",
                                                "dark:bg-gray-800 dark:text-gray-400 dark:ring-[#1a1a1e]"
                                            )}>
                                                +{projectMembers.length - 3}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                                )}
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <span className={getThemeClasses("text-xs font-semibold text-gray-500 block mb-1.5", "dark:text-gray-400")}>
                                Priority:
                            </span>
                            <div className="mt-1">
                                {task.Priority ? (
                                    getPriorityBadge(task.Priority)
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
                                )}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div>
                            <span className={getThemeClasses("text-xs font-semibold text-gray-500 block mb-1.5", "dark:text-gray-400")}>
                                Due date:
                            </span>
                            <div className="flex items-center gap-1 mt-1 text-gray-700 dark:text-gray-300 font-medium">
                                <div className="w-5 h-5 rounded-full border border-green-200 bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400">
                                    <FaClock size={10} />
                                </div>
                                <span className="text-xs whitespace-nowrap">{getMobileDueDateText(task.DueDate)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className={getThemeClasses("text-base font-bold text-gray-900 flex items-center gap-2", "dark:text-white")}>
                            <FaTasks className={getThemeClasses("text-gray-500", "dark:text-gray-400")} />
                            Description
                        </h3>
                        {task.Description ? (
                            <p className={getThemeClasses("text-sm text-gray-600 leading-relaxed", "dark:text-gray-300")}>
                                {task.Description}
                            </p>
                        ) : (
                            <p className={getThemeClasses("text-sm text-gray-400 italic", "dark:text-gray-500")}>
                                No description provided
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className={getThemeClasses("border-t border-gray-100", "dark:border-gray-800")} />

                    {/* Attachment Section */}
                    <div>
                        <TaskAttachments taskId={task.TaskID} userId={userDetails?._id} initialAttachments={attachments} />
                    </div>

                    {/* Divider */}
                    <div className={getThemeClasses("border-t border-gray-100", "dark:border-gray-800")} />

                    {/* Subtasks Section */}
                    <div>
                        <SubtaskList taskId={task.TaskID} subtasks={subtasks} onSubtasksChange={setSubtasks} />
                    </div>

                    {/* Divider */}
                    <div className={getThemeClasses("border-t border-gray-100", "dark:border-gray-800")} />

                    {/* Comments List */}
                    <div className="space-y-4">
                        <h3 className={getThemeClasses("text-base font-bold text-gray-900 flex items-center gap-2", "dark:text-white")}>
                            <FaReply className={getThemeClasses("text-gray-500", "dark:text-gray-400")} />
                            Comments ({comments.length})
                        </h3>
                        <div className="space-y-3">
                            {comments.length === 0 ? (
                                <p className={getThemeClasses("text-sm text-gray-400 italic", "dark:text-gray-500")}>No comments yet.</p>
                            ) : (
                                comments.map(comment => {
                                    const isAuthor = comment.Author === (userDetails?.fullName || userDetails?.username) || userDetails?.role === 'Admin';
                                    const isEditing = editingCommentId === comment.CommentID;
                                    return (
                                        <div key={comment.CommentID} className={getThemeClasses("p-3 rounded-xl bg-gray-50/50 border border-gray-100 flex gap-3 items-start", "dark:bg-[#202024]/20 dark:border-[#2b2b30]")}>
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                                                {getUserInitials(comment.Author)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className={getThemeClasses("font-semibold text-xs text-gray-900 truncate", "dark:text-gray-200")}>{comment.Author}</span>
                                                        <span className="text-xs text-gray-400 shrink-0">•</span>
                                                        <span className="text-xs text-gray-400 shrink-0">{formatTimeAgo(comment.Timestamp)}</span>
                                                        {comment.edited && (
                                                            <span className="text-[9px] text-blue-500 font-semibold shrink-0 dark:text-blue-400"> (edited)</span>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    {isAuthor && !isEditing && (
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button
                                                                onClick={() => { setEditingCommentId(comment.CommentID); setEditingCommentText(comment.Content); }}
                                                                className={getThemeClasses(
                                                                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                                                                    'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                                                                )}
                                                                title="Edit"
                                                            >
                                                                <FaEdit size={10} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteComment(comment.CommentID)}
                                                                className={getThemeClasses(
                                                                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                                                    'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                                                )}
                                                                title="Delete"
                                                            >
                                                                <FaTrash size={10} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-2 mt-1">
                                                        <textarea
                                                            value={editingCommentText}
                                                            onChange={(e) => setEditingCommentText(e.target.value)}
                                                            className={getThemeClasses(
                                                                "w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none",
                                                                "dark:bg-[#1a1a1e] dark:border-gray-700 dark:text-white"
                                                            )}
                                                            rows={2}
                                                            autoFocus
                                                        />
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleEditComment(comment.CommentID)}
                                                                className="px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 flex items-center gap-1 transition-colors"
                                                            >
                                                                <FaCheck size={8} /> Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingCommentId(null)}
                                                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200 flex items-center gap-1 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-dark-hover"
                                                            >
                                                                <FaTimes size={8} /> Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className={getThemeClasses("text-xs text-gray-600 leading-relaxed break-words", "dark:text-gray-300")}>{renderCommentContent(comment.Content)}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className={getThemeClasses("border-t border-gray-100", "dark:border-gray-800")} />

                    {/* Project Information Section */}
                    {project && (
                        <div className={getThemeClasses(
                            "border border-gray-100 rounded-2xl p-4 bg-gray-50/30",
                            "dark:border-gray-800 dark:bg-transparent"
                        )}>
                            <h2 className={getThemeClasses("text-lg font-bold text-gray-900 flex items-center gap-2 mb-3 pb-2 border-b border-gray-100", "dark:text-gray-100 dark:border-gray-800")}>
                                <FaProjectDiagram className={getThemeClasses("text-blue-500", "dark:text-blue-400")} size={18} />
                                Project Info
                            </h2>
                            <div className="space-y-3.5">
                                <div>
                                    <div className={getThemeClasses(
                                        "text-xs font-semibold text-gray-400 mb-0.5",
                                        "dark:text-gray-500"
                                    )}>Project Name</div>
                                    <Link
                                        href={`/project/${project.ProjectID || project._id}`}
                                        className={getThemeClasses(
                                            "text-blue-600 hover:text-blue-800 font-semibold text-sm block",
                                            "dark:text-blue-400 dark:hover:text-blue-300"
                                        )}
                                    >
                                        {project.Name}
                                    </Link>
                                </div>
                                {project.Description && (
                                    <div>
                                        <div className={getThemeClasses(
                                            "text-xs font-semibold text-gray-400 mb-0.5",
                                            "dark:text-gray-500"
                                        )}>Description</div>
                                        <div className={getThemeClasses(
                                            "text-sm text-gray-600 leading-relaxed",
                                            "dark:text-gray-300"
                                        )}>
                                            {project.Description}
                                        </div>
                                    </div>
                                )}
                                {project.DueDate && (
                                    <div>
                                        <div className={getThemeClasses(
                                            "text-xs font-semibold text-gray-400 mb-0.5",
                                            "dark:text-gray-500"
                                        )}>Project Deadline</div>
                                        <div className={getThemeClasses(
                                            "text-sm text-gray-800 font-semibold",
                                            "dark:text-gray-200"
                                        )}>
                                            {new Date(project.DueDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    {project?.githubRepository?.connected && (
                        <>
                            <div className={getThemeClasses("border-t border-gray-100", "dark:border-gray-800")} />

                            {/* Development Section (Mobile UI) */}
                            <div className={getThemeClasses(
                                "border border-gray-100 rounded-2xl p-4 bg-gray-50/30",
                                "dark:border-gray-800 dark:bg-transparent"
                            )}>
                                <h2 className={getThemeClasses("text-lg font-bold text-gray-900 flex items-center gap-2 mb-3 pb-2 border-b border-gray-100", "dark:text-gray-100 dark:border-gray-800")}>
                                    <FaCodeBranch className="text-blue-500" size={18} />
                                    Development
                                </h2>
                                <div className={getThemeClasses(
                                    "flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 mb-3",
                                    "dark:border-zinc-800 dark:bg-zinc-900/50 mb-3"
                                )}>
                                    <div className="bg-[#e84c22] rounded-lg p-2.5 flex items-center justify-center h-11 w-11 shrink-0 shadow-sm">
                                        <FaGitAlt className="text-white text-2xl" />
                                    </div>
                                    <div className={getThemeClasses("text-sm leading-relaxed text-gray-600", "dark:text-gray-300")}>
                                        Link a GitHub <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium" onClick={() => { setGitLinkType('Commit'); setIsGitLinkModalOpen(true); }}>commit</span>,{' '}
                                        <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium" onClick={() => { setGitLinkType('Pull Request'); setIsGitLinkModalOpen(true); }}>pull request</span> or{' '}
                                        <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium" onClick={() => { setGitLinkType('Branch'); setIsGitLinkModalOpen(true); }}>branch</span> to see the status of your development.
                                    </div>
                                </div>

                                {/* List of linked items */}
                                {task?.gitLinks?.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto mt-3 pl-3 space-y-1">
                                        {task.gitLinks.map((link) => {
                                            const repoUrl = project?.githubRepository?.repositoryUrl;
                                            const commitUrl = repoUrl
                                                ? (link.linkType === 'Commit'
                                                    ? `${repoUrl}/commit/${link.commitSha}`
                                                    : (link.linkType === 'Branch'
                                                        ? `${repoUrl}/tree/${link.commitSha}`
                                                        : (link.linkType === 'Pull Request'
                                                            ? `${repoUrl}/pull/${link.commitSha}`
                                                            : null)))
                                                : null;
                                            const displaySha = link.linkType === 'Commit'
                                                ? `#${link.commitSha.substring(0, 7)}`
                                                : `#${link.commitSha}`;

                                            return (
                                                <div
                                                    key={link._id}
                                                    className="py-1 flex items-center justify-between gap-3 text-xs"
                                                    title={`Comment: ${link.comment || 'No comment'}\nLinked by ${link.linkedBy} on ${new Date(link.linkedAt).toLocaleDateString()}`}
                                                >
                                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                                                        <span
                                                            className={getThemeClasses(
                                                                "text-blue-600 shrink-0 flex items-center justify-center w-5 h-5",
                                                                "text-blue-400"
                                                            )}
                                                            title={link.linkType}
                                                        >
                                                            {link.linkType === 'Commit' && <FaGitAlt className="text-sm" />}
                                                            {link.linkType === 'Branch' && <FaCodeBranch className="text-sm" />}
                                                            {link.linkType === 'Pull Request' && <FaGitAlt className="text-sm" />}
                                                        </span>
                                                        {commitUrl ? (
                                                            <a
                                                                href={commitUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                                                            >
                                                                {displaySha}
                                                            </a>
                                                        ) : (
                                                            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                                                                {displaySha}
                                                            </span>
                                                        )}
                                                        {(link.commitMessage || link.comment) && (
                                                            <span className={getThemeClasses("text-gray-505 font-medium truncate block max-w-[500px]", "dark:text-gray-400")} title={link.commitMessage || link.comment}>
                                                                - {link.commitMessage || link.comment}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteGitLink(link._id)}
                                                        className={getThemeClasses(
                                                            "inline-flex items-center justify-center w-6 h-6 rounded-full text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200 shrink-0",
                                                            "dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50"
                                                        )}
                                                        title="Remove link"
                                                    >
                                                        <FaTimes size={10} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Divider */}
                    <div className={getThemeClasses("border-t border-gray-100", "dark:border-gray-800")} />

                    {/* History Section */}
                    <div className={getThemeClasses(
                        "border border-gray-100 rounded-2xl p-4 bg-gray-50/30",
                        "dark:border-gray-800 dark:bg-transparent"
                    )}>
                        <h2 className={getThemeClasses("text-lg font-bold text-gray-900 flex items-center gap-2 mb-3 pb-2 border-b border-gray-100", "dark:text-gray-100 dark:border-gray-800")}>
                            <FaClock className={getThemeClasses("text-green-500", "dark:text-green-400")} size={18} />
                            History
                        </h2>
                        <div>
                            {activityLoading ? (
                                <div className={getThemeClasses(
                                    "text-center py-6 text-gray-400 text-sm",
                                    "dark:text-gray-500"
                                )}>Loading activity...</div>
                            ) : taskActivity?.length > 0 ? (
                                <div className="space-y-3.5 pb-2">
                                    {taskActivity.map((activity, index) => (
                                        <div key={activity._id || index} className="flex items-start gap-2.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                            <div className="flex-1 min-w-0">
                                                <div className={getThemeClasses(
                                                    "text-xs text-gray-800 font-medium leading-relaxed break-words",
                                                    "dark:text-gray-200"
                                                )}>
                                                    {formatActivityDisplay(activity)}
                                                </div>
                                                <div className={getThemeClasses(
                                                    "text-xs text-gray-400 mt-0.5",
                                                    "dark:text-gray-500"
                                                )}>
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Pagination Controls */}
                                    <div className="flex justify-end items-center gap-2 mt-4 pt-2 border-t border-gray-50 dark:border-gray-800/40">
                                        <button
                                            className={getThemeClasses(
                                                "px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors",
                                                "dark:bg-gray-800 dark:hover:bg-dark-hover"
                                            )}
                                            disabled={activityPage === 1}
                                            onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                                        >
                                            Prev
                                        </button>
                                        <span className={getThemeClasses(
                                            "text-xs text-gray-500",
                                            "dark:text-gray-400"
                                        )}>
                                            Page {activityPage} of {activityTotalPages}
                                        </span>
                                        <button
                                            className={getThemeClasses(
                                                "px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors",
                                                "dark:bg-gray-800 dark:hover:bg-dark-hover"
                                            )}
                                            disabled={activityPage === activityTotalPages}
                                            onClick={() => setActivityPage(p => Math.min(activityTotalPages, p + 1))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className={getThemeClasses(
                                        "text-gray-400 text-xs",
                                        "dark:text-gray-500"
                                    )}>No activity recorded yet</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sticky Comment Box Bar */}
                    <div className={getThemeClasses(
                        "fixed bottom-0 left-0 right-0 z-45 bg-white border-t border-gray-200 px-4 py-3 shadow-xl flex flex-col gap-2 pb-safe",
                        "dark:bg-dark-bg dark:border-gray-800"
                    )}>
                        <div className="flex items-center gap-3">
                            {/* Input container */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Comment on the task..."
                                    value={mobileCommentText}
                                    onChange={(e) => setMobileCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleMobileCommentSubmit()}
                                    className={getThemeClasses(
                                        "w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all",
                                        "dark:bg-[#202024]/60 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:bg-[#1c1c20] dark:focus:ring-blue-500"
                                    )}
                                />
                            </div>
                            <button
                                onClick={handleMobileCommentSubmit}
                                disabled={!mobileCommentText.trim() || mobileSubmitting}
                                className={`rounded-xl p-2.5 text-white flex items-center justify-center transition-all duration-200 shadow-sm ${mobileCommentText.trim() && !mobileSubmitting
                                    ? 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105 active:scale-95'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                    }`}
                            >
                                <FaPaperPlane size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop View */}
                <div className="hidden lg:grid grid-cols-6 gap-4" data-task-id={taskId}>
                    {/* Left/Main Section */}
                    <div className="lg:col-span-3">
                        {/* Task Progress Bar */}
                        <div className="mb-6">
                            <div className={getThemeClasses(
                                'bg-white border border-gray-200 rounded-xl p-6 shadow-sm',
                                'dark:bg-transparent dark:border-gray-700'
                            )}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={getThemeClasses(
                                        'text-lg font-semibold text-gray-900 flex items-center gap-2',
                                        'dark:text-gray-100'
                                    )}>
                                        <FaTasks className="text-blue-500 dark:text-blue-400" />
                                        Task Progress: {getTaskProgressPercentage(task.Status)}%
                                    </h3>

                                    {/* Collaboration Indicator - Moved to right side */}
                                    <TaskCollaborationIndicator taskId={taskId} projectId={task?.ProjectID_FK} />
                                </div>
                                {/* Progress Steps with Progress Bar Behind */}
                                <div className="relative flex items-center justify-between">
                                    {/* Progress Bar Background */}
                                    <div className={getThemeClasses(
                                        'absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full mx-3',
                                        'dark:bg-gray-700'
                                    )}>
                                        <div className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${getTaskProgressPercentage(task.Status)}%` }}
                                        ></div>
                                    </div>

                                    {getProgressSteps().map((step, index) => {
                                        const isCompleted = isStepCompleted(step.status, task.Status);
                                        const isCurrent = step.status === task.Status;
                                        const stepStatusInfo = getStatusInfo(step.status);

                                        return (
                                            <div key={step.status} className="flex flex-col items-center relative z-20">
                                                <div className={getThemeClasses(
                                                    `w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${isCompleted
                                                        ? 'bg-green-500 text-white shadow-lg'
                                                        : isCurrent
                                                            ? `${stepStatusInfo.statusStyle.bgLight} ${stepStatusInfo.statusStyle.textLight} bg-gray-200 shadow-lg scale-110`
                                                            : `${stepStatusInfo.statusStyle.bgLight} ${stepStatusInfo.statusStyle.textLight} bg-gray-200`
                                                    }`,
                                                    `dark:${isCompleted
                                                        ? 'bg-green-500 text-white'
                                                        : isCurrent
                                                            ? `${stepStatusInfo.statusStyle.bgDark} ${stepStatusInfo.statusStyle.textDark} shadow-lg scale-110`
                                                            : `${stepStatusInfo.statusStyle.bgDark} ${stepStatusInfo.statusStyle.textDark} `
                                                    }`
                                                )}>
                                                    {isCompleted ? (
                                                        <FaCheckCircle size={16} />
                                                    ) : (
                                                        stepStatusInfo.statusIcon
                                                    )}
                                                </div>
                                                <span className={getThemeClasses(
                                                    `text-xs font-medium text-center max-w-16 whitespace-nowrap ${isCompleted
                                                        ? 'text-green-600 '
                                                        : isCurrent
                                                            ? `${stepStatusInfo.statusStyle.textLight}`
                                                            : `${stepStatusInfo.statusStyle.textLight}`
                                                    }`,
                                                    `dark:${isCompleted
                                                        ? 'text-green-400'
                                                        : isCurrent
                                                            ? `${stepStatusInfo.statusStyle.textDark}`
                                                            : `${stepStatusInfo.statusStyle.textDark}`
                                                    }`
                                                )}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Task Description - Enhanced UI */}
                        <div className="mb-8">
                            {task.Name.startsWith('Support Request:') ? (
                                /* Support Request Card */
                                <div className={getThemeClasses(
                                    'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 shadow-sm',
                                    'dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-700/50 dark:shadow-none'
                                )}>
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                                <h3 className={getThemeClasses(
                                                    'text-lg font-semibold text-orange-800',
                                                    'dark:text-orange-300'
                                                )}>
                                                    Customer Support Request
                                                </h3>
                                                {/* Mobile badges - show on small screens */}
                                                <div className="flex flex-wrap items-center gap-2 sm:hidden">
                                                    {getTaskTypeBadge(task.Type)}
                                                    {task.Priority && getPriorityBadge(task.Priority)}
                                                </div>
                                            </div>

                                            {/* Support Request Details */}
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className={getThemeClasses(
                                                        'text-sm font-bold text-orange-700 mb-1',
                                                        'dark:text-orange-400'
                                                    )}>
                                                        Request Summary
                                                    </h4>
                                                    <p className={getThemeClasses(
                                                        'text-sm text-orange-800 leading-relaxed',
                                                        'dark:text-orange-200'
                                                    )}>
                                                        {task.Description ? task.Description.split('\n\nDescription: ')[0] : 'No summary provided'}
                                                    </p>
                                                </div>

                                                {task.Description && task.Description.includes('\n\nDescription: ') && (
                                                    <div>
                                                        <h4 className={getThemeClasses(
                                                            'text-sm font-bold text-orange-700 mb-1',
                                                            'dark:text-orange-400'
                                                        )}>
                                                            Detailed Description
                                                        </h4>
                                                        <p className={getThemeClasses(
                                                            'text-sm text-orange-800 leading-relaxed',
                                                            'dark:text-orange-200'
                                                        )}>
                                                            {task.Description.split('\n\nDescription: ')[1]}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Desktop badges and controls - hidden on mobile */}
                                        <div className="hidden sm:flex items-end gap-2 flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                                {getTaskTypeBadge(task.Type)}
                                                {task.Priority && getPriorityBadge(task.Priority)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Status Dropdown */}
                                                <div className="relative status-dropdown">
                                                    <button
                                                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                                        className={getThemeClasses(
                                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-transparent border-none shadow-none transition-colors cursor-pointer",
                                                            "dark:bg-transparent border-none shadow-none dark:text-gray-100"
                                                        )}
                                                        style={{ minWidth: 120 }}
                                                        disabled={updatingStatus}
                                                    >
                                                        <span className={`inline-flex items-center gap-2 ${statusInfo.statusStyle.textLight}`}>{statusInfo.statusIcon} {statusInfo.statusName}</span>
                                                        <FaChevronDown size={12} className={getThemeClasses("ml-1 text-gray-400", "dark:text-gray-500")} />
                                                    </button>
                                                    {statusDropdownOpen && (
                                                        <div className={getThemeClasses(
                                                            "absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10",
                                                            "dark:bg-gray-800 dark:border-gray-700"
                                                        )}>
                                                            <div className="py-1">
                                                                {Object.entries(statusMap).map(([statusCode, statusName]) => {
                                                                    const currentStatusInfo = getStatusInfo(parseInt(statusCode));
                                                                    const isCurrentStatus = parseInt(statusCode) === task.Status;
                                                                    return (
                                                                        <button
                                                                            key={statusCode}
                                                                            onClick={() => handleStatusUpdate(parseInt(statusCode))}
                                                                            disabled={updatingStatus || isCurrentStatus}
                                                                            className={getThemeClasses(
                                                                                `w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${isCurrentStatus ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`,
                                                                                `dark:hover:bg-dark-hover ${isCurrentStatus ? 'dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`
                                                                            )}
                                                                        >
                                                                            {currentStatusInfo.statusIcon}
                                                                            {statusName}
                                                                            {isCurrentStatus && (
                                                                                <span className={getThemeClasses(
                                                                                    "ml-auto text-blue-600",
                                                                                    "dark:text-blue-400"
                                                                                )}>
                                                                                    <FaCheckCircle size={12} />
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Delete Icon */}
                                                <button
                                                    onClick={handleDeleteTask}
                                                    className={getThemeClasses(
                                                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                                        'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                                    )}
                                                    title="Delete Task"
                                                >
                                                    <MdDelete size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mobile controls - show on small screens */}
                                        <div className="flex sm:hidden items-center justify-between w-full pt-4">
                                            {/* Mobile Status Dropdown */}
                                            <div className="relative status-dropdown flex-1">
                                                <button
                                                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                                    className={getThemeClasses(
                                                        "inline-flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium bg-transparent border border-orange-200 transition-colors cursor-pointer",
                                                        "dark:bg-transparent dark:border-orange-700/50 dark:text-gray-100"
                                                    )}
                                                    disabled={updatingStatus}
                                                >
                                                    <span className={`inline-flex items-center gap-2 ${statusInfo.statusStyle.textLight}`}>{statusInfo.statusIcon} {statusInfo.statusName}</span>
                                                    <FaChevronDown size={12} className={getThemeClasses("text-gray-400", "dark:text-gray-500")} />
                                                </button>
                                                {statusDropdownOpen && (
                                                    <div className={getThemeClasses(
                                                        "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10",
                                                        "dark:bg-gray-800 dark:border-gray-700"
                                                    )}>
                                                        <div className="py-1">
                                                            {Object.entries(statusMap).map(([statusCode, statusName]) => {
                                                                const currentStatusInfo = getStatusInfo(parseInt(statusCode));
                                                                const isCurrentStatus = parseInt(statusCode) === task.Status;
                                                                return (
                                                                    <button
                                                                        key={statusCode}
                                                                        onClick={() => handleStatusUpdate(parseInt(statusCode))}
                                                                        disabled={updatingStatus || isCurrentStatus}
                                                                        className={getThemeClasses(
                                                                            `w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${isCurrentStatus ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`,
                                                                            `dark:hover:bg-dark-hover ${isCurrentStatus ? 'dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`
                                                                        )}
                                                                    >
                                                                        {currentStatusInfo.statusIcon}
                                                                        {statusName}
                                                                        {isCurrentStatus && (
                                                                            <span className={getThemeClasses(
                                                                                "ml-auto text-blue-600",
                                                                                "dark:text-blue-400"
                                                                            )}>
                                                                                <FaCheckCircle size={12} />
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Regular Task Description Card */
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
                                                Task Description
                                            </h3>
                                            {task.Description ? (
                                                <p className={getThemeClasses(
                                                    'text-sm text-blue-700 leading-relaxed',
                                                    'dark:text-blue-200'
                                                )}>
                                                    {task.Description}
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
                                    <div className="flex items-center justify-between gap-2 flex-shrink-0">
                                        {/* Right side - Task Type Badge and Priority */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {getTaskTypeBadge(task.Type)}
                                            {/* Priority Badge using existing system */}
                                            {task.Priority && getPriorityBadge(task.Priority)}
                                        </div>
                                        {/* Status Dropdown */}
                                        <div className="relative status-dropdown">
                                            <button
                                                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                                className={getThemeClasses(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-transparent border-none shadow-none transition-colors cursor-pointer",
                                                    "dark:bg-transparent border-none shadow-none dark:text-gray-100"
                                                )}
                                                style={{ minWidth: 120 }}
                                                disabled={updatingStatus}
                                            >
                                                <span className={`inline-flex items-center gap-2 ${statusInfo.statusStyle.textLight}`}>{statusInfo.statusIcon} {statusInfo.statusName}</span>
                                                <FaChevronDown size={12} className={getThemeClasses("ml-1 text-gray-400", "dark:text-gray-500")} />
                                            </button>
                                            {statusDropdownOpen && (
                                                <div className={getThemeClasses(
                                                    "absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10",
                                                    "dark:bg-gray-800 dark:border-gray-700"
                                                )}>
                                                    <div className="py-1">
                                                        {Object.entries(statusMap).map(([statusCode, statusName]) => {
                                                            const currentStatusInfo = getStatusInfo(parseInt(statusCode));
                                                            const isCurrentStatus = parseInt(statusCode) === task.Status;
                                                            return (
                                                                <button
                                                                    key={statusCode}
                                                                    onClick={() => handleStatusUpdate(parseInt(statusCode))}
                                                                    disabled={updatingStatus || isCurrentStatus}
                                                                    className={getThemeClasses(
                                                                        `w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${isCurrentStatus ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`,
                                                                        `dark:hover:bg-dark-hover ${isCurrentStatus ? 'dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`
                                                                    )}
                                                                >
                                                                    {currentStatusInfo.statusIcon}
                                                                    {statusName}
                                                                    {isCurrentStatus && (
                                                                        <span className={getThemeClasses(
                                                                            "ml-auto text-blue-600",
                                                                            "dark:text-blue-400"
                                                                        )}>
                                                                            <FaCheckCircle size={12} />
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Delete Icon */}
                                        <button
                                            onClick={handleDeleteTask}
                                            className={getThemeClasses(
                                                'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                                'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                            )}
                                            title="Delete Task"
                                        >
                                            <MdDelete size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* --- MEMBER ASSIGNMENT SECTION (for non-User Story tasks) --- */}
                        {task.Type !== 'User Story' && (
                            <div className="flex items-center gap-4 mt-4 mb-4">
                                <div className={getThemeClasses("text-sm font-medium text-gray-500  ", "dark:text-gray-400")}>Assigned To:</div>
                                <div className="relative member-dropdown">
                                    <button
                                        onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                                        className={getThemeClasses(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-transparent border-none shadow-none transition-colors cursor-pointer",
                                            "dark:bg-transparent border-none shadow-none dark:text-gray-100"
                                        )}
                                        style={{ minWidth: 120 }}
                                        disabled={assigningMember}>
                                        <div className="flex items-center gap-2">
                                            {task.AssignedToDetails ? (
                                                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                                                    {getUserInitials(task.AssignedToDetails.fullName)}
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-medium">
                                                    ?
                                                </div>
                                            )}
                                            <span className={getThemeClasses("text-gray-900", "dark:text-gray-100")}>
                                                {task.AssignedToDetails ?
                                                    task.AssignedToDetails.fullName :
                                                    'Select member'
                                                }
                                            </span>
                                        </div>
                                        <FaChevronDown size={12} className={getThemeClasses("ml-1 text-gray-400", "dark:text-gray-500")} />
                                    </button>
                                    {memberDropdownOpen && (
                                        <div className={getThemeClasses(
                                            "absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10",
                                            "dark:bg-gray-800 dark:border-gray-700"
                                        )}>
                                            <div className="py-1">
                                                {/* Self assign option */}
                                                <button
                                                    onClick={() => handleMemberAssignment('self')}
                                                    disabled={assigningMember}
                                                    className={getThemeClasses(
                                                        "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2",
                                                        "dark:hover:bg-dark-hover dark:text-gray-300"
                                                    )}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                                                        {getUserInitials(userDetails?.fullName || userDetails?.firstName + ' ' + userDetails?.lastName || 'Me')}
                                                    </div>
                                                    <span className={getThemeClasses("text-gray-900", "dark:text-gray-100")}>Assign to me</span>
                                                </button>
                                                {/* Team members */}
                                                {projectMembers.map((member) => (
                                                    <button
                                                        key={member._id}
                                                        onClick={() => handleMemberAssignment(member._id)}
                                                        disabled={assigningMember}
                                                        className={getThemeClasses(
                                                            `w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${task.AssignedTo === member._id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`,
                                                            `dark:hover:bg-dark-hover ${task.AssignedTo === member._id ? 'dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`
                                                        )}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${task.AssignedTo === member._id
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-gray-200 text-gray-700'
                                                            }`}>
                                                            {getUserInitials(member.fullName)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className={getThemeClasses("font-medium text-gray-900", "dark:text-gray-100")}>{member.fullName}</div>
                                                            <div className={getThemeClasses("text-xs text-gray-500", "dark:text-gray-400")}>
                                                                {member.username}
                                                            </div>
                                                        </div>
                                                        {task.AssignedTo === member._id && (
                                                            <FaCheckCircle size={12} className={getThemeClasses("text-blue-600", "dark:text-blue-400")} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {assigningMember && (
                                    <div className={getThemeClasses(
                                        "mt-2 text-sm text-gray-500 flex items-center gap-2",
                                        "dark:text-gray-300"
                                    )}>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                        Assigning task...
                                    </div>
                                )}
                            </div>
                        )}
                        {/* --- END UPPER PART --- */}

                        {/* --- ATTACHMENTS SECTION --- */}
                        <div className="mb-5">
                            <TaskAttachments taskId={task.TaskID} userId={userDetails?._id} initialAttachments={attachments} />
                        </div>
                        {/* Divider between Attachments and Subtasks */}
                        <div className={getThemeClasses("border-t border-gray-200 mb-5", "dark:border-gray-700")}></div>
                        {/* --- SUBTASKS SECTION --- */}
                        <div className="mb-5">
                            <SubtaskList taskId={task.TaskID} subtasks={subtasks} onSubtasksChange={setSubtasks} />
                        </div>
                        {/* Divider between Subtasks and Comments */}
                        <div className={getThemeClasses("border-t border-gray-200 mb-5", "dark:border-gray-700")}></div>
                        {/* --- COMMENTS SECTION --- */}
                        <div className="mb-5">
                            <TaskComments taskId={task.TaskID} userId={userDetails?._id} userName={userDetails?.fullName || userDetails?.username || 'User'} initialComments={comments} projectMembers={projectMembers} />
                        </div>
                    </div>
                    <div className='lg:col-span-1'>
                        {/* --- TASK DATES SECTION --- */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className={getThemeClasses("text-base font-bold text-gray-900 flex items-center gap-2", "dark:text-gray-100")}>
                                    <FaCalendarAlt className="text-blue-500" /> Task Dates
                                </h3>
                            </div>
                            <div className={getThemeClasses(
                                "flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50",
                                "dark:border-zinc-800 dark:bg-zinc-900/50"
                            )}>
                                {/* Created Date */}
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                                    <span className={getThemeClasses("text-xs font-semibold text-gray-500 flex items-center gap-2", "dark:text-gray-400")}>
                                        <FaCalendarAlt className="text-blue-550 text-xs" /> Created
                                    </span>
                                    <span className={getThemeClasses("text-xs font-semibold text-gray-900", "dark:text-gray-100")}>
                                        {task.CreatedDate ? new Date(task.CreatedDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : 'Not available'}
                                    </span>
                                </div>

                                {/* Assigned Date */}
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                                    <span className={getThemeClasses("text-xs font-semibold text-gray-500 flex items-center gap-2", "dark:text-gray-400")}>
                                        <FaClock className="text-purple-550 text-xs" /> Assigned
                                    </span>
                                    <span className={getThemeClasses("text-xs font-semibold text-gray-900", "dark:text-gray-100")}>
                                        {task.AssignedDate ? new Date(task.AssignedDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : 'Not assigned'}
                                    </span>
                                </div>

                                {/* Due Date */}
                                <div className="flex items-center justify-between">
                                    <span className={getThemeClasses("text-xs font-semibold text-gray-500 flex items-center gap-2", "dark:text-gray-400")}>
                                        <FaClock className="text-orange-555 text-xs" /> Due Date
                                    </span>
                                    <span className={getThemeClasses("text-xs font-semibold text-gray-900", "dark:text-gray-100")}>
                                        {task.DueDate ? new Date(task.DueDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : 'Today 11:59 PM'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Right Column - Project Info & Actions */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* --- PROJECT INFORMATION SECTION --- */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className={getThemeClasses("text-base font-bold text-gray-900 flex items-center gap-2", "dark:text-gray-100")}>
                                    <FaProjectDiagram className="text-blue-500" /> Project Info
                                </h3>
                            </div>
                            <div className={getThemeClasses(
                                "flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50",
                                "dark:border-zinc-800 dark:bg-zinc-900/50"
                            )}>
                                {project && (
                                    <div className="space-y-2 pb-2">
                                        <Link
                                            href={`/project/${project.ProjectID || project._id}`}
                                            className={getThemeClasses(
                                                "text-blue-600 hover:text-blue-800 font-medium text-lg block",
                                                "dark:text-blue-400 dark:hover:text-blue-300"
                                            )}
                                        >
                                            {project.Name}
                                        </Link>
                                        {project.Description && (
                                            <div className={getThemeClasses(
                                                "text-gray-900",
                                                "dark:text-gray-100"
                                            )}>
                                                {project.Description}
                                            </div>
                                        )}
                                        {project.DueDate && (
                                            <div>
                                                <div className={getThemeClasses(
                                                    "text-sm font-medium text-gray-500 mb-1",
                                                    "dark:text-gray-400"
                                                )}>Project Deadline</div>
                                                <div className={getThemeClasses(
                                                    "text-gray-900 font-medium",
                                                    "dark:text-gray-100"
                                                )}>
                                                    {new Date(project.DueDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- DEVELOPMENT SECTION --- */}
                        {project?.githubRepository?.connected && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className={getThemeClasses("text-base font-bold text-gray-900 flex items-center gap-2", "dark:text-gray-100")}>
                                        <FaCodeBranch className="text-blue-500" /> Development
                                    </h3>
                                </div>
                                <div className={getThemeClasses(
                                    "flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50",
                                    "dark:border-zinc-800 dark:bg-zinc-900/50"
                                )}>
                                    <div className="bg-[#e84c22] rounded-lg p-2.5 flex items-center justify-center h-11 w-11 shrink-0 shadow-sm">
                                        <FaGitAlt className="text-white text-2xl" />
                                    </div>
                                    <div className={getThemeClasses("text-sm leading-relaxed text-gray-600", "dark:text-gray-300")}>
                                        Link a GitHub <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium" onClick={() => { setGitLinkType('Commit'); setIsGitLinkModalOpen(true); }}>commit</span>,{' '}
                                        <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium" onClick={() => { setGitLinkType('Pull Request'); setIsGitLinkModalOpen(true); }}>pull request</span> or{' '}
                                        <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium" onClick={() => { setGitLinkType('Branch'); setIsGitLinkModalOpen(true); }}>branch</span> to see the status of your development.                                    </div>
                                </div>

                                {/* List of linked items */}
                                {task?.gitLinks?.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto mt-3 pl-8 space-y-1">
                                        {task.gitLinks.map((link) => {
                                            const repoUrl = project?.githubRepository?.repositoryUrl;
                                            const commitUrl = repoUrl
                                                ? (link.linkType === 'Commit'
                                                    ? `${repoUrl}/commit/${link.commitSha}`
                                                    : (link.linkType === 'Branch'
                                                        ? `${repoUrl}/tree/${link.commitSha}`
                                                        : (link.linkType === 'Pull Request'
                                                            ? `${repoUrl}/pull/${link.commitSha}`
                                                            : null)))
                                                : null;
                                            const displaySha = link.linkType === 'Commit'
                                                ? `#${link.commitSha.substring(0, 7)}`
                                                : `#${link.commitSha}`;

                                            return (
                                                <div
                                                    key={link._id}
                                                    className="py-1 flex items-center justify-between gap-3 text-xs"
                                                    title={`Comment: ${link.comment || 'No comment'}\nLinked by ${link.linkedBy} on ${new Date(link.linkedAt).toLocaleDateString()}`}
                                                >
                                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                                                        <span
                                                            className={getThemeClasses(
                                                                "text-blue-600 shrink-0 flex items-center justify-center w-5 h-5",
                                                                "text-blue-400"
                                                            )}
                                                            title={link.linkType}
                                                        >
                                                            {link.linkType === 'Commit' && <FaGitAlt className="text-sm" />}
                                                            {link.linkType === 'Branch' && <FaCodeBranch className="text-sm" />}
                                                            {link.linkType === 'Pull Request' && <FaGitAlt className="text-sm" />}
                                                        </span>
                                                        {commitUrl ? (
                                                            <a
                                                                href={commitUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                                                            >
                                                                {displaySha}
                                                            </a>
                                                        ) : (
                                                            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                                                                {displaySha}
                                                            </span>
                                                        )}
                                                        {(link.commitMessage || link.comment) && (
                                                            <span className={getThemeClasses("text-gray-505 font-medium truncate block max-w-[500px]", "dark:text-gray-400")} title={link.commitMessage || link.comment}>
                                                                - {link.commitMessage || link.comment}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteGitLink(link._id)}
                                                        className={getThemeClasses(
                                                            "inline-flex items-center justify-center w-5 h-5 rounded-full text-red-600 hover:bg-red-200 hover:shadow-sm transition-all duration-200 shrink-0",
                                                            "dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50"
                                                        )}
                                                        title="Remove link"
                                                    >
                                                        <FaTimes size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- HISTORY SECTION --- */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className={getThemeClasses("text-base font-bold text-gray-900 flex items-center gap-2", "dark:text-gray-100")}>
                                    <FaClock className="text-blue-500" /> History
                                </h3>
                            </div>
                            <div className={getThemeClasses(
                                "flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50",
                                "dark:border-zinc-800 dark:bg-zinc-900/50"
                            )}>
                                <div className="w-full">
                                    {activityLoading ? (
                                        <div className={getThemeClasses(
                                            "text-center py-8 text-gray-400",
                                            "dark:text-gray-300"
                                        )}>Loading...</div>
                                    ) : taskActivity?.length > 0 ? (
                                        <div className="space-y-4 pb-4">
                                            {taskActivity.map((activity, index) => (
                                                <div key={activity._id || index} className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                                    <div className="flex-1">
                                                        <div className={getThemeClasses(
                                                            "text-sm text-gray-900 font-medium",
                                                            "dark:text-gray-100"
                                                        )}>
                                                            {formatActivityDisplay(activity)}
                                                        </div>
                                                        <div className={getThemeClasses(
                                                            "text-xs text-gray-500 mt-1",
                                                            "dark:text-gray-400"
                                                        )}>
                                                            {new Date(activity.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Pagination Controls */}
                                            <div className="flex justify-end items-center gap-2 mt-4">
                                                <button
                                                    className={getThemeClasses(
                                                        "px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50",
                                                        "dark:bg-gray-700 dark:hover:bg-gray-600"
                                                    )}
                                                    disabled={activityPage === 1}
                                                    onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                                                >
                                                    Prev
                                                </button>
                                                <span className={getThemeClasses(
                                                    "text-sm text-gray-600",
                                                    "dark:text-gray-300"
                                                )}>
                                                    Page {activityPage} of {activityTotalPages}
                                                </span>
                                                <button
                                                    className={getThemeClasses(
                                                        "px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50",
                                                        "dark:bg-gray-700 dark:hover:bg-gray-600"
                                                    )}
                                                    disabled={activityPage === activityTotalPages}
                                                    onClick={() => setActivityPage(p => Math.min(activityTotalPages, p + 1))}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className={getThemeClasses(
                                                "text-gray-400 text-sm",
                                                "dark:text-gray-300"
                                            )}>No activity recorded yet</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* User Story Tasks List */}
                        {task.Type === 'User Story' && (
                            <div className="px-6 pb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={getThemeClasses(
                                        "text-md font-semibold text-gray-800 mt-4",
                                        "dark:text-gray-100"
                                    )}>Links</h4>
                                    <button
                                        className={getThemeClasses(
                                            "ml-2 p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-colors",
                                            "dark:bg-blue-700 dark:hover:bg-blue-800"
                                        )}
                                        title="Add Task to this User Story"
                                        onClick={() => setShowAddTaskModal(true)}
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                                {userStoryTasks.length === 0 ? (
                                    <div className={getThemeClasses(
                                        "text-gray-400 text-sm",
                                        "dark:text-gray-300"
                                    )}>No tasks found for this user story.</div>
                                ) : (
                                    <ul className={getThemeClasses(
                                        "divide-y divide-gray-100",
                                        "dark:divide-gray-700"
                                    )}>
                                        {userStoryTasks.map(t => {
                                            return (
                                                <li key={t.TaskID} className="py-3">
                                                    <div className="flex items-start gap-3">
                                                        {/* Task Type Badge - Icon Only */}
                                                        <div className="flex items-center justify-center w-8 h-8">
                                                            {getTaskTypeBadge(t.Type)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <Link
                                                                href={`/task/${t.TaskID}`}
                                                                className={getThemeClasses(
                                                                    "font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200 block",
                                                                    "dark:text-blue-400 dark:hover:text-blue-300"
                                                                )}
                                                            >
                                                                {t.Name}
                                                            </Link>
                                                            <div className={getThemeClasses(
                                                                "text-xs text-gray-500 mt-1",
                                                                "dark:text-gray-400"
                                                            )}>
                                                                Updated {formatTimeAgo(t.ModifiedDate)}
                                                            </div>
                                                        </div>
                                                        {/* Status Badge */}
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all duration-200 ${statusColors[t.Status]?.light || 'bg-gray-50'} ${statusColors[t.Status]?.textLight || 'text-gray-700'} ${statusColors[t.Status]?.borderLight || 'border-gray-200'}`}>
                                                            {statusIcons[t.Status]}
                                                            {statusMap[t.Status] || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                                <AddTaskModal
                                    isOpen={showAddTaskModal}
                                    onClose={() => setShowAddTaskModal(false)}
                                    onAddTask={handleAddTask}
                                    mode="fromProject"
                                    projectIdDefault={task.ProjectID_FK}
                                    userStories={[{ TaskID: task.TaskID, Name: task.Name }]}
                                    addTaskTypeMode="task"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showDeleteModal && (
                <CustomModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Delete Task"
                    getThemeClasses={getThemeClasses}
                    actions={
                        <>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className={getThemeClasses(
                                    'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                                    'dark:text-gray-400 dark:hover:bg-dark-hover'
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteTask}
                                className={getThemeClasses(
                                    'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
                                    'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                                )}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </>
                    }
                >
                    <p className={getThemeClasses(
                        'text-gray-600',
                        'dark:text-gray-400'
                    )}>
                        Are you sure you want to delete this task? This action cannot be undone.
                    </p>
                </CustomModal>
            )}
            {isGitLinkModalOpen && (
                <CustomModal
                    isOpen={isGitLinkModalOpen}
                    onClose={() => setIsGitLinkModalOpen(false)}
                    title="Add link"
                    getThemeClasses={getThemeClasses}
                    maxWidthClass="max-w-4xl"
                    actions={
                        <>
                            <button
                                type="button"
                                onClick={() => setIsGitLinkModalOpen(false)}
                                className={getThemeClasses(
                                    'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 text-sm font-semibold',
                                    'dark:text-gray-400 dark:hover:bg-dark-hover dark:border-zinc-800'
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitGitLink}
                                disabled={!gitCommitSha || gitSubmitting}
                                className={getThemeClasses(
                                    `px-4 py-2.5 rounded-xl text-white font-semibold transition-all duration-200 text-sm ${!gitCommitSha
                                        ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed border border-gray-200 dark:border-zinc-800'
                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md'
                                    }`,
                                    `px-4 py-2.5 rounded-xl text-white font-semibold transition-all duration-200 text-sm ${!gitCommitSha
                                        ? 'bg-zinc-850 text-zinc-500 cursor-not-allowed border border-zinc-800'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`
                                )}
                            >
                                {gitSubmitting ? 'Adding...' : 'Add link'}
                            </button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <span className={getThemeClasses("text-xs font-semibold text-gray-500", "dark:text-zinc-400")}>
                                You are adding a link from:
                            </span>
                            <div className={getThemeClasses(
                                "flex items-start gap-2.5 p-3 rounded-xl border border-gray-150 bg-gray-50/50 mt-1.5",
                                "dark:border-zinc-800 dark:bg-zinc-900/30"
                            )}>
                                <input
                                    type="checkbox"
                                    checked
                                    disabled
                                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className={getThemeClasses("text-sm font-semibold text-gray-900 truncate", "dark:text-white")}>
                                        {task?.TicketNumber ? `#${task.TicketNumber} ` : ''}{task?.Name}
                                    </p>
                                    <p className="text-xs text-gray-405 dark:text-gray-500 mt-0.5">
                                        Updated {new Date(task?.ModifiedDate || task?.CreatedDate || new Date()).toLocaleDateString()} • {statusMap[task?.Status] || 'To Do'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={getThemeClasses("block text-xs font-semibold text-gray-600 mb-1.5", "dark:text-zinc-350")}>
                                Link type:
                            </label>
                            <CustomDropdown
                                value={gitLinkType}
                                onChange={(val) => {
                                    setGitLinkType(val);
                                    setGitCommitSha('');
                                    setGitComment('');
                                    setGitCommitMessage('');
                                    setGitCommitsList([]);
                                }}
                                options={[
                                    { value: 'Commit', label: 'Commit' },
                                    { value: 'Branch', label: 'Branch' },
                                    { value: 'Pull Request', label: 'Pull Request' }
                                ]}
                                size="sm"
                            />
                        </div>

                        <div>
                            <label className={getThemeClasses("block text-xs font-semibold text-gray-600 mb-1.5", "dark:text-zinc-305")}>
                                Repository:
                            </label>
                            <select
                                disabled
                                className={getThemeClasses(
                                    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm focus:outline-none",
                                    "w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-sm focus:outline-none"
                                )}
                            >
                                <option>{project?.githubRepository?.repositoryFullName || 'No connected repository'}</option>
                            </select>
                        </div>

                        <div>
                            <label className={getThemeClasses("block text-xs font-semibold text-gray-600 mb-1.5", "dark:text-zinc-305")}>
                                {gitLinkType === 'Branch' ? 'Branch name:' : (gitLinkType === 'Pull Request' ? 'Pull request number:' : 'Commit:')}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={
                                        gitLinkType === 'Branch'
                                            ? 'Enter branch name (e.g. main)'
                                            : (gitLinkType === 'Pull Request' ? 'Enter pull request number (e.g. 12)' : 'Enter commit SHA (e.g. 5ea9f32)')
                                    }
                                    value={gitCommitSha}
                                    onChange={e => setGitCommitSha(e.target.value)}
                                    className={getThemeClasses(
                                        "flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900",
                                        "flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={
                                        gitLinkType === 'Branch'
                                            ? handleFindBranches
                                            : (gitLinkType === 'Pull Request' ? handleFindPullRequests : handleFindCommits)
                                    }
                                    disabled={gitCommitsLoading}
                                    className={getThemeClasses(
                                        "px-4 py-2.5 rounded-xl bg-gray-105 hover:bg-gray-200 text-gray-750 text-xs font-semibold border border-gray-200 transition-colors disabled:opacity-50",
                                        "px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50"
                                    )}
                                >
                                    {gitCommitsLoading
                                        ? 'Searching...'
                                        : (gitLinkType === 'Branch' ? 'Find branches' : (gitLinkType === 'Pull Request' ? 'Find pull requests' : 'Find commits'))
                                    }
                                </button>
                            </div>
                        </div>                        {/* Recent commits selection list */}
                        {gitCommitsList.length > 0 && (
                            <div className="space-y-2 mt-3">
                                <label className={getThemeClasses(
                                    "block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500",
                                    "block text-xs font-bold uppercase tracking-widest text-zinc-500"
                                )}>
                                    {gitLinkType === 'Branch'
                                        ? 'Select a branch:'
                                        : (gitLinkType === 'Pull Request' ? 'Select a recent pull request:' : 'Select a recent commit:')}
                                </label>
                                <div className={getThemeClasses(
                                    "border border-gray-100 rounded-2xl bg-white max-h-56 overflow-y-auto divide-y divide-gray-50 shadow-inner p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-gray-250 scrollbar-track-transparent",
                                    "border border-zinc-800 rounded-2xl bg-zinc-900 max-h-56 overflow-y-auto divide-y divide-zinc-850 shadow-inner p-1.5 space-y-1 dark:scrollbar-thumb-zinc-700"
                                )}>
                                    {gitCommitsList.map((c) => {
                                        if (gitLinkType === 'Pull Request') {
                                            const isSelected = gitCommitSha === String(c.number);
                                            const prStatusColor = c.state === 'open'
                                                ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/50'
                                                : 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/50';
                                            return (
                                                <button
                                                    key={c.number}
                                                    type="button"
                                                    onClick={() => {
                                                        setGitCommitSha(String(c.number));
                                                        setGitComment(`PR #${c.number}: ${c.title}`);
                                                        setGitCommitMessage(`PR #${c.number}: ${c.title}`);
                                                    }}
                                                    className={getThemeClasses(
                                                        `w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 border relative overflow-hidden ${isSelected
                                                            ? 'bg-blue-50/60 border-blue-200 text-blue-900 shadow-sm scale-[0.99]'
                                                            : 'bg-transparent border-transparent hover:bg-gray-50/70 text-gray-700'
                                                        }`,
                                                        `w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 border relative overflow-hidden ${isSelected
                                                            ? 'bg-blue-950/20 border-blue-800 text-blue-300 shadow-sm scale-[0.99]'
                                                            : 'bg-transparent border-transparent hover:bg-zinc-800/40 text-zinc-300'
                                                        }`
                                                    )}
                                                >
                                                    {/* Selected Indicator Left Bar */}
                                                    {isSelected && (
                                                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-500 rounded-r" />
                                                    )}

                                                    {/* PR Icon Avatar circle */}
                                                    <div className={getThemeClasses(
                                                        `w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${isSelected
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                        }`,
                                                        `w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${isSelected
                                                            ? 'bg-blue-900/40 text-blue-300'
                                                            : 'bg-zinc-850 text-zinc-405'
                                                        }`
                                                    )}>
                                                        <FaGitAlt />
                                                    </div>

                                                    {/* PR details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center gap-2 mb-0.5">
                                                            <span className={getThemeClasses(
                                                                `font-mono text-xs font-bold px-1.5 py-0.5 rounded ${isSelected
                                                                    ? 'bg-blue-100 text-blue-850'
                                                                    : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'
                                                                }`,
                                                                `font-mono text-xs font-bold px-1.5 py-0.5 rounded ${isSelected
                                                                    ? 'bg-blue-900/60 text-blue-305'
                                                                    : 'bg-zinc-800 text-zinc-300'
                                                                }`
                                                            )}>
                                                                #{c.number}
                                                            </span>
                                                            <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border ${prStatusColor}`}>
                                                                {c.state}
                                                            </span>
                                                        </div>
                                                        <p className={getThemeClasses(
                                                            `text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-905'}`,
                                                            `text-sm font-semibold truncate ${isSelected ? 'text-blue-300' : 'text-white'}`
                                                        )}>
                                                            {c.title}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                                            branch: {c.branch} • by {c.user}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        }

                                        if (gitLinkType === 'Branch') {
                                            const isSelected = gitCommitSha === c.name;
                                            return (
                                                <button
                                                    key={c.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setGitCommitSha(c.name);
                                                        setGitComment(`Branch: ${c.name}`);
                                                        setGitCommitMessage(`Branch: ${c.name}`);
                                                    }}
                                                    className={getThemeClasses(
                                                        `w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 border relative overflow-hidden ${isSelected
                                                            ? 'bg-blue-50/60 border-blue-200 text-blue-900 shadow-sm scale-[0.99]'
                                                            : 'bg-transparent border-transparent hover:bg-gray-50/70 text-gray-700'
                                                        }`,
                                                        `w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 border relative overflow-hidden ${isSelected
                                                            ? 'bg-blue-950/20 border-blue-800 text-blue-300 shadow-sm scale-[0.99]'
                                                            : 'bg-transparent border-transparent hover:bg-zinc-800/40 text-zinc-300'
                                                        }`
                                                    )}
                                                >
                                                    {/* Selected Indicator Left Bar */}
                                                    {isSelected && (
                                                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-500 rounded-r" />
                                                    )}

                                                    {/* Branch Icon Avatar circle */}
                                                    <div className={getThemeClasses(
                                                        `w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${isSelected
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                        }`,
                                                        `w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${isSelected
                                                            ? 'bg-blue-900/40 text-blue-300'
                                                            : 'bg-zinc-850 text-zinc-405'
                                                        }`
                                                    )}>
                                                        <FaCodeBranch />
                                                    </div>

                                                    {/* Branch details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center gap-2 mb-0.5">
                                                            <span className={getThemeClasses(
                                                                `font-mono text-xs font-bold px-1.5 py-0.5 rounded ${isSelected
                                                                    ? 'bg-blue-100 text-blue-850'
                                                                    : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'
                                                                }`,
                                                                `font-mono text-xs font-bold px-1.5 py-0.5 rounded ${isSelected
                                                                    ? 'bg-blue-900/60 text-blue-305'
                                                                    : 'bg-zinc-800 text-zinc-300'
                                                                }`
                                                            )}>
                                                                {c.name}
                                                            </span>
                                                            {c.protected && (
                                                                <span className="text-[9px] uppercase tracking-wider font-extrabold text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/50">
                                                                    Protected
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                                            Last commit: {c.commitSha?.substring(0, 7)}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        }

                                        const isSelected = gitCommitSha === c.sha;
                                        const committerName = c.committer?.name || 'GitHub User';
                                        const authorInitials = committerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                        const commitDate = new Date(c.committer?.date || new Date()).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });

                                        return (
                                            <button
                                                key={c.sha}
                                                type="button"
                                                onClick={() => {
                                                    setGitCommitSha(c.sha);
                                                    setGitComment(c.message || '');
                                                    setGitCommitMessage(c.message || '');
                                                }}
                                                className={getThemeClasses(
                                                    `w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 border relative overflow-hidden ${isSelected
                                                        ? 'bg-blue-50/60 border-blue-200 text-blue-900 shadow-sm scale-[0.99]'
                                                        : 'bg-transparent border-transparent hover:bg-gray-50/70 text-gray-700'
                                                    }`,
                                                    `w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 border relative overflow-hidden ${isSelected
                                                        ? 'bg-blue-950/20 border-blue-800 text-blue-300 shadow-sm scale-[0.99]'
                                                        : 'bg-transparent border-transparent hover:bg-zinc-800/40 text-zinc-300'
                                                    }`
                                                )}
                                            >
                                                {/* Author Avatar circle */}
                                                <div className={getThemeClasses(
                                                    `w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isSelected
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                    }`,
                                                    `w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isSelected
                                                        ? 'bg-blue-900/40 text-blue-300'
                                                        : 'bg-zinc-850 text-zinc-405'
                                                    }`
                                                )}>
                                                    {authorInitials}
                                                </div>

                                                {/* Commit details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center gap-2 mb-0.5">
                                                        <span className={getThemeClasses(
                                                            `font-mono text-xs font-bold px-1.5 py-0.5 rounded ${isSelected
                                                                ? 'bg-blue-100 text-blue-850'
                                                                : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'
                                                            }`,
                                                            `font-mono text-xs font-bold px-1.5 py-0.5 rounded ${isSelected
                                                                ? 'bg-blue-900/60 text-blue-305'
                                                                : 'bg-zinc-800 text-zinc-300'
                                                            }`
                                                        )}>
                                                            #{c.sha.substring(0, 7)}
                                                        </span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                                            {commitDate}
                                                        </span>
                                                    </div>
                                                    <p className={getThemeClasses(
                                                        `text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-905'}`,
                                                        `text-sm font-semibold truncate ${isSelected ? 'text-blue-300' : 'text-white'}`
                                                    )}>
                                                        {c.message && c.message.length > 60
                                                            ? `${c.message.substring(0, 60)}...`
                                                            : c.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                                        by {committerName}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className={getThemeClasses("block text-xs font-semibold text-gray-600 mb-1.5", "dark:text-zinc-305")}>
                                Comment:
                            </label>
                            <input
                                type="text"
                                placeholder="Enter a comment"
                                value={gitComment}
                                onChange={e => setGitComment(e.target.value)}
                                className={getThemeClasses(
                                    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900",
                                    "w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                )}
                            />
                        </div>
                    </div>
                </CustomModal>
            )}
        </>
    );
};

export default TaskDetailsPage; 