import { useEffect, useState, useContext, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { FaArrowLeft, FaUser, FaCalendar, FaTag, FaExclamationTriangle, FaCheckCircle, FaClock, FaShieldAlt, FaRocket, FaTimes, FaEdit, FaTrash, FaProjectDiagram, FaUsers, FaCalendarAlt, FaUserFriends, FaInfoCircle, FaCog, FaChevronDown, FaUserPlus, FaPlus } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { useToast } from '../../context/ToastContext';
import { taskService, projectService, taskDetailsService } from '../../services/api';
import TaskDetailsSkeleton from '../../components/TaskDetailsSkeleton';
import { statusMap, statusIcons, statusColors, getTaskTypeDetails, getPriorityStyle, useThemeClasses } from '../../components/kanbanUtils';
import { connectSocket, subscribe, getSocket } from '../../services/socket';
import TaskAttachments from '../../components/TaskAttachments';
import TaskComments from '../../components/TaskComments';

import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import CustomModal from '../../components/CustomModal';
import axios from 'axios';
import { getTaskTypeBadge, getPriorityBadge, getTaskTypeStyle } from '../../components/TaskTypeBadge';
import AddTaskModal from '../../components/AddTaskModal';

const TaskDetailsPage = () => {
    const router = useRouter();
    const { taskId } = router.query;
    const { theme } = useTheme();
    const { userDetails } = useGlobal();
    const { showToast } = useToast();
    const getThemeClasses = useThemeClasses();
    const { user } = useAuth();

    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [userStoryTasks, setUserStoryTasks] = useState([]);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    useEffect(() => {
        const fetchTaskDetails = async () => {
            if (!taskId) {
                return; // Don't fetch if taskId is not available yet
            }

            // Validate taskId format
            if (typeof taskId !== 'string' || taskId.trim() === '') {
                setError('Invalid task ID');
                setLoading(false);
                return;
            }

            // Check if user is authenticated
            const isAuthenticated = authService.isAuthenticated();
            if (!isAuthenticated) {
                router.push('/login');
                return;
            }

            setLoading(true);
            try {
                const data = await taskDetailsService.getFullTaskDetails(taskId);
                setTask(data.task);
                setProject(data.project);
                setProjectMembers(data.projectMembers || []);
                setSubtasks(data.subtasks);
                setAttachments(data.attachments);
                setComments(data.comments);
                setUserStoryTasks(data.userStoryTasks || []); // use directly from API
            } catch (err) {
                console.error('Error fetching task details:', err);
                setError('Failed to fetch task details');
                showToast('Failed to fetch task details', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchTaskDetails();
        // Join task room for real-time
        if (taskId) {
            connectSocket();
            try { getSocket().emit('task.join', { taskId }); } catch (_) {}
        }
        return () => {
            if (taskId) {
                try { getSocket().emit('task.leave', { taskId }); } catch (_) {}
            }
        };
    }, [taskId, router, user]);

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
            if (!data || data.taskId !== taskId) return;
            setTask(prev => ({ ...prev, ...(data.changes || {}) }));
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

    const getTaskTypeInfo = (type) => {
        return getTaskTypeDetails(type);
    };

    const getPriorityInfo = (priority) => {
        return getPriorityStyle(priority);
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

    const handleEditTask = () => {
        // TODO: Implement edit functionality
        showToast('Edit functionality coming soon', 'info');
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
            await taskService.updateTaskStatus(taskId, newStatus, user?._id);
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
                        user: user?._id,
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
            const assigneeId = memberId === 'self' ? user?._id : memberId;

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

    const formatTimeAgo = (date) => {
        if (!date) return '';
        const now = new Date();
        const taskDate = new Date(date);
        const diffInMinutes = Math.floor((now - taskDate) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return taskDate.toLocaleDateString();
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

    const handleAddTask = async (taskData) => {
        try {
            // Set ParentID to current user story's TaskID and always set ProjectID_FK
            const newTask = await taskService.addTaskDetails({ ...taskData, ParentID: task.TaskID, ProjectID_FK: task.ProjectID_FK }, 'fromProject');
            setUserStoryTasks(prev => [...prev, newTask]);
            showToast('Task added successfully!', 'success');
            setShowAddTaskModal(false);
        } catch (err) {
            showToast('Failed to add task', 'error');
        }
    };

    if (loading) {
        return (
            <Layout>
                <TaskDetailsSkeleton />
            </Layout>
        );
    }

    if (error || !task) {
        return (
            <Layout>
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
            </Layout>
        );
    }

    const statusInfo = getStatusInfo(task.Status);
    const typeInfo = getTaskTypeInfo(task.Type);
    const priorityInfo = getPriorityInfo(task.Priority);

    return (
        <Layout>
            <Head>
                <title>{task.Name} | TeamLabs</title>
            </Head>
            <div className="mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left/Main Section */}
                    <div className="lg:col-span-2">
                        {/* --- UPPER PART: IMAGE UI ROLLBACK --- */}
                        <div className="mb-8">
                            <div className="flex flex-col gap-2">
                                {/* Title Row */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                        {editingTaskName ? (
                                            <div ref={editTaskNameInputRef} className="flex items-center gap-2" style={{ width: '100%' }}>
                                                <input
                                                    className={getThemeClasses(
                                                        "px-3 py-2 rounded-lg bg-transparent text-gray-900 focus:outline-none focus:ring-0 text-3xl font-bold border-none shadow-none",
                                                        "dark:bg-transparent dark:text-gray-100 border-none shadow-none"
                                                    )}
                                                    value={newTaskName}
                                                    onChange={e => setNewTaskName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSaveTaskName()}
                                                    autoFocus
                                                    style={{ minWidth: '200px', width: '100%' }}
                                                />
                                                <button
                                                    onClick={handleSaveTaskName}
                                                    className={getThemeClasses(
                                                        "px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors",
                                                        "dark:bg-blue-700 dark:hover:bg-blue-800"
                                                    )}
                                                    title="Save Task Name"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <h1 ref={taskNameSpanRef} className={getThemeClasses(
                                                    "text-3xl md:text-4xl font-bold text-gray-900 truncate",
                                                    "dark:text-gray-100"
                                                )}>{task.Name}</h1>
                                                <button onClick={handleEditTaskName} className={getThemeClasses(
                                                    "p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                                                    "dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700"
                                                )} title="Edit Task Name"><FaEdit size={18} /></button>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
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
                                                                        `dark:hover:bg-gray-700 ${isCurrentStatus ? 'dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`
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
                                        <button onClick={handleDeleteTask} className={getThemeClasses(
                                            "p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2",
                                            "dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                                        )} title="Delete Task"><FaTrash size={18} /></button>
                                    </div>
                                </div>
                                {/* Type Badge Row */}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${typeInfo.bgColor} ${typeInfo.textColor} border ${typeInfo.borderColor}`}>{typeInfo.icon}{task.Type}</span>
                                </div>
                            </div>
                            {/* Description Section */}
                            <div className="mt-6">
                                <label className={getThemeClasses(
                                    "block text-sm font-medium text-gray-700 mb-2",
                                    "dark:text-gray-300"
                                )}>Description</label>
                                <textarea
                                    value={task.Description || ''}
                                    readOnly
                                    className={getThemeClasses(
                                        "w-full px-4 py-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 resize-none text-base",
                                        "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                    )}
                                    rows={3}
                                    placeholder="No description available"
                                />
                            </div>

                            {/* --- MEMBER ASSIGNMENT SECTION (for non-User Story tasks) --- */}
                            {task.Type !== 'User Story' && (
                                <div className="flex items-center gap-4 pb-4">
                                    <div className={getThemeClasses("text-sm font-medium text-gray-500 mb-1", "dark:text-gray-400")}>Assigned To:</div>
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
                                                "absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10",
                                                "dark:bg-gray-800 dark:border-gray-700"
                                            )}>
                                                <div className="py-1">
                                                    {/* Self assign option */}
                                                    <button
                                                        onClick={() => handleMemberAssignment('self')}
                                                        disabled={assigningMember}
                                                        className={getThemeClasses(
                                                            "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2",
                                                            "dark:hover:bg-gray-700 dark:text-gray-300"
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
                                                                `dark:hover:bg-gray-700 ${task.AssignedTo === member._id ? 'dark:bg-blue-900/30 dark:text-blue-300' : 'dark:text-gray-300'}`
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
                        </div>
                        {/* --- END UPPER PART --- */}

                        {/* --- ATTACHMENTS SECTION --- */}
                        <div className="mb-5">
                            <TaskAttachments taskId={task.TaskID} userId={userDetails?._id} initialAttachments={attachments} />
                        </div>
                        {/* Divider between Attachments and Comments */}
                        <div className={getThemeClasses("border-t border-gray-200 mb-5", "dark:border-gray-700")}></div>
                        {/* --- COMMENTS SECTION --- */}
                        <div className="mb-5">
                            <TaskComments taskId={task.TaskID} userId={userDetails?._id} userName={userDetails?.fullName || userDetails?.username || 'User'} initialComments={comments} projectMembers={projectMembers} />
                        </div>
                    </div>
                    {/* Right Column - Project Info & Actions */}
                    <div className="space-y-5">
                        {/* --- TASK DATES SECTION --- */}
                        <div className={getThemeClasses(
                            "border border-gray-200 rounded-xl px-6 bg-transparent",
                            "dark:border-gray-700 dark:bg-transparent"
                        )}>
                            <h2 className={getThemeClasses("text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2 border-b border-gray-200 py-4", "dark:text-gray-100 dark:border-gray-700")}>
                                <FaCalendarAlt className={getThemeClasses("text-blue-500", "dark:text-blue-400")} />
                                Task Dates
                            </h2>
                            <div className="space-y-4 pb-4">
                                <div>
                                    <div className={getThemeClasses(
                                        "text-sm font-medium text-gray-500 mb-1",
                                        "dark:text-gray-400"
                                    )}>Created Date</div>
                                    <div className={getThemeClasses(
                                        "text-gray-900 font-medium",
                                        "dark:text-gray-100"
                                    )}>
                                        {task.CreatedDate ? new Date(task.CreatedDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'Not available'}
                                    </div>
                                </div>
                                {task.AssignedDate && (
                                    <div>
                                        <div className={getThemeClasses(
                                            "text-sm font-medium text-gray-500 mb-1",
                                            "dark:text-gray-400"
                                        )}>Assigned Date</div>
                                        <div className={getThemeClasses(
                                            "text-gray-900 font-medium",
                                            "dark:text-gray-100"
                                        )}>
                                            {new Date(task.AssignedDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- PROJECT INFORMATION SECTION --- */}
                        <div className={getThemeClasses(
                            "border border-gray-200 rounded-xl px-6 bg-transparent",
                            "dark:border-gray-700 dark:bg-transparent"
                        )}>
                            <h2 className={getThemeClasses("text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2 border-b border-gray-200 py-4", "dark:text-gray-100 dark:border-gray-700")}>
                                <FaProjectDiagram className={getThemeClasses("text-purple-500", "dark:text-purple-400")} />
                                Project Information
                            </h2>
                            {project && (
                                <div className="space-y-4 pb-4">
                                    <div>
                                        <div className={getThemeClasses(
                                            "text-sm font-medium text-gray-500 mb-1",
                                            "dark:text-gray-400"
                                        )}>Project Name</div>
                                        <Link
                                            href={`/project/${project.ProjectID || project._id}`}
                                            className={getThemeClasses(
                                                "text-blue-600 hover:text-blue-800 font-medium text-lg block",
                                                "dark:text-blue-400 dark:hover:text-blue-300"
                                            )}
                                        >
                                            {project.Name}
                                        </Link>
                                    </div>
                                    {project.Description && (
                                        <div>
                                            <div className={getThemeClasses(
                                                "text-sm font-medium text-gray-500 mb-1",
                                                "dark:text-gray-400"
                                            )}>Description</div>
                                            <div className={getThemeClasses(
                                                "text-gray-900",
                                                "dark:text-gray-100"
                                            )}>
                                                {project.Description}
                                            </div>
                                        </div>
                                    )}
                                    {project.FinishDate && (
                                        <div>
                                            <div className={getThemeClasses(
                                                "text-sm font-medium text-gray-500 mb-1",
                                                "dark:text-gray-400"
                                            )}>Project Deadline</div>
                                            <div className={getThemeClasses(
                                                "text-gray-900 font-medium",
                                                "dark:text-gray-100"
                                            )}>
                                                {new Date(project.FinishDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* --- HISTORY SECTION --- */}
                        <div className={getThemeClasses(
                            "border border-gray-200 rounded-xl px-6 bg-transparent",
                            "dark:border-gray-700 dark:bg-transparent"
                        )}>
                            <h2 className={getThemeClasses("text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2 border-b border-gray-200 py-4", "dark:text-gray-100 dark:border-gray-700")}>
                                <FaClock className={getThemeClasses("text-green-500", "dark:text-green-400")} />
                                History
                            </h2>
                            <div>
                                {activityLoading ? (
                                    <div className={getThemeClasses(
                                        "text-center py-8 text-gray-400",
                                        "dark:text-gray-300"
                                    )}>Loading...</div>
                                ) : taskActivity.length > 0 ? (
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
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 text-xs font-medium ${getTaskTypeStyle(t.Type).textColor} shadow-sm transition-all duration-200`}>
                                                            {getTaskTypeStyle(t.Type).icon}
                                                        </span>
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
                                    'dark:text-gray-400 dark:hover:bg-gray-700'
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
        </Layout>
    );
};

export default TaskDetailsPage; 