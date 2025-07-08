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
import LoadingScreen from '../../components/LoadingScreen';
import { statusMap, statusIcons, statusColors, getTaskTypeDetails, getPriorityStyle, useThemeClasses } from '../../components/kanbanUtils';
import TaskAttachments from '../../components/TaskAttachments';
import TaskComments from '../../components/TaskComments';
import Breadcrumb from '../../components/Breadcrumb';
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
            await taskService.updateTaskStatus(taskId, newStatus, user?._id);
            setTask(prev => ({ ...prev, Status: newStatus }));
            setStatusDropdownOpen(false);
            showToast('Task status updated successfully', 'success');
        } catch (err) {
            showToast('Failed to update task status', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleMemberAssignment = async (memberId) => {
        setAssigningMember(true);
        try {
            // If memberId is null or 'self', use current user's ID
            const assigneeId = memberId === 'self' || !memberId ? user?._id : memberId;
            const response = await taskService.assignTask(taskId, assigneeId);

            // Update task with the response data which includes the new assignee details
            setTask(prev => ({
                ...prev,
                AssignedTo: assigneeId,
                AssignedToDetails: response.AssignedToDetails
            }));

            // Update task activity from the response
            if (response.taskActivity) {
                setTaskActivity(response.taskActivity);
            }

            setMemberDropdownOpen(false);
            showToast('Task assigned successfully', 'success');
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
                <LoadingScreen />
            </Layout>
        );
    }

    if (error || !task) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-2xl mb-4 font-semibold">Task not found</div>
                        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
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
                {/* Breadcrumb Navigation */}
                <Breadcrumb
                    type="task"
                    projectName={project?.Name || 'Unknown Project'}
                    projectId={project?.ProjectID || project?._id || ''}
                    taskName={task.Name || ''}
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left/Main Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-sm  overflow-hidden">
                            {/* Task Details Section */}
                            <div className="mb-4">
                                <div className="flex justify-between gap-2">
                                    <div className="flex mt-2 ml-1 gap-2 w-full" >
                                        {editingTaskName ? (
                                            <div ref={editTaskNameInputRef} className="flex items-center gap-2" style={{ width: '70%' }}>
                                                <input
                                                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold mb-2"
                                                    value={newTaskName}
                                                    onChange={e => setNewTaskName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSaveTaskName()}
                                                    autoFocus
                                                    style={{ minWidth: '200px', width: '100%' }}
                                                />
                                                <button
                                                    onClick={handleSaveTaskName}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                    title="Save Task Name"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <h1 ref={taskNameSpanRef} className="text-4xl font-bold text-gray-900 mb-2 break-words inline-block">{task.Name}</h1>
                                                <button onClick={handleEditTaskName} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Task Name"><FaEdit size={18} /></button>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative status-dropdown">
                                            <button
                                                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                                className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                                disabled={updatingStatus}
                                            >
                                                <span className={`inline-flex whitespace-nowrap items-center gap-2 ${statusInfo.statusStyle.textLight}`}>
                                                    {statusInfo.statusIcon}
                                                    {statusInfo.statusName}
                                                </span>
                                                <FaChevronDown size={10} className="text-gray-400" />
                                            </button>

                                            {statusDropdownOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                                    <div className="py-1">
                                                        {Object.entries(statusMap).map(([statusCode, statusName]) => {
                                                            const currentStatusInfo = getStatusInfo(parseInt(statusCode));
                                                            const isCurrentStatus = parseInt(statusCode) === task.Status;
                                                            return (
                                                                <button
                                                                    key={statusCode}
                                                                    onClick={() => handleStatusUpdate(parseInt(statusCode))}
                                                                    disabled={updatingStatus || isCurrentStatus}
                                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${isCurrentStatus ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                                                        }`}
                                                                >
                                                                    {currentStatusInfo.statusIcon}
                                                                    {statusName}
                                                                    {isCurrentStatus && (
                                                                        <span className="ml-auto text-blue-600">
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
                                        <button onClick={handleDeleteTask} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Task"><FaTrash size={18} /></button>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${typeInfo.bgColor} ${typeInfo.textColor} border ${typeInfo.borderColor}`}>{typeInfo.icon}{task.Type}</span>
                                        {task.Priority && task.Type !== 'User Story' && (
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${priorityInfo.bgColor} ${priorityInfo.textColor} border ${priorityInfo.borderColor}`}>{priorityInfo.icon}{task.Priority}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={task.Description || ''}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 resize-none"
                                    rows={3}
                                    placeholder="No description available"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Assigned To */}
                                {task.Type !== 'User Story' && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 text-sm flex-shrink-0"><FaUser className="inline mr-1" />Assigned To:</span>
                                        {projectMembers.length > 0 ? (
                                            <div className="relative member-dropdown">
                                                {task.AssignedToDetails ? (
                                                    <button
                                                        onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                                                        className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                                        disabled={assigningMember}
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                                                            {task.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <span className="text-gray-900 font-medium">{task.AssignedToDetails.fullName}</span>
                                                        <FaChevronDown size={10} className="text-gray-400" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                                                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                                        disabled={assigningMember}
                                                    >
                                                        <FaUserPlus size={12} className="text-gray-500" />
                                                        <span>Assign Task</span>
                                                        <FaChevronDown size={10} className="text-gray-400" />
                                                    </button>
                                                )}

                                                {memberDropdownOpen && (
                                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                                        <div className="py-1">
                                                            {/* Assign to self option */}
                                                            <button
                                                                onClick={() => handleMemberAssignment('self')}
                                                                disabled={assigningMember}
                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                                                            >
                                                                <FaUser size={12} className="text-blue-600" />
                                                                Assign to me
                                                            </button>
                                                            <div className="border-t border-gray-100 my-1"></div>

                                                            {/* Project members */}
                                                            {projectMembers.map((member) => {
                                                                const isAssigned = task.AssignedTo === member._id;
                                                                return (
                                                                    <button
                                                                        key={member._id}
                                                                        onClick={() => handleMemberAssignment(member._id)}
                                                                        disabled={assigningMember || isAssigned}
                                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${isAssigned ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                                                            }`}
                                                                    >
                                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                                                                            {member.fullName.split(' ').map(n => n[0]).join('')}
                                                                        </div>
                                                                        <span className="flex-1">{member.fullName}</span>
                                                                        {isAssigned && (
                                                                            <span className="text-blue-600">
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
                                        ) : (
                                            <span className="text-gray-400">No project members available</span>
                                        )}
                                    </div>
                                )}
                                {/* Created Date */}
                                {task.CreatedDate && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 text-sm flex-shrink-0"><FaCalendarAlt className="inline mr-1" />Created:</span>
                                        <span className="text-gray-900 font-medium">{new Date(task.CreatedDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {/* Due Date */}
                                {task.DueDate && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 text-sm flex-shrink-0"><FaClock className="inline mr-1" />Due:</span>
                                        <span className="text-gray-900 font-medium">{new Date(task.DueDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Subtasks Section
                            <div className="py-6">
                                <TaskSubtasks taskId={task.TaskID} initialSubtasks={subtasks} />
                            </div> */}
                            <div className="mt-4 border-t border-gray-100" />
                            {/* Attachments Section */}
                            <div className="py-6">
                                <TaskAttachments taskId={task.TaskID} userId={userDetails?._id} initialAttachments={attachments} />
                            </div>
                            <div className="border-t border-gray-100" />
                            {/* Comments Section */}
                            <div className="h-[1800px] overflow-y-auto py-6">
                                <TaskComments
                                    taskId={task.TaskID}
                                    userId={userDetails?._id}
                                    userName={userDetails?.fullName || userDetails?.username || 'User'}
                                    initialComments={comments}
                                    projectMembers={projectMembers}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Project Info & Actions */}
                    <div className="space-y-6">
                        {/* Project Information */}
                        {project && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <FaProjectDiagram className="text-purple-500" />
                                        Project Information
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-1">Project Name</div>
                                            <Link
                                                href={`/project/${project.ProjectID || project._id}`}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-lg block"
                                            >
                                                {project.Name}
                                            </Link>
                                        </div>
                                        {project.Description && (
                                            <div>
                                                <div className="text-sm font-medium text-gray-500 mb-1">Description</div>
                                                <div className="text-gray-900">
                                                    {project.Description}
                                                </div>
                                            </div>
                                        )}
                                        {project.FinishDate && (
                                            <div>
                                                <div className="text-sm font-medium text-gray-500 mb-1">Project Deadline</div>
                                                <div className="text-gray-900 font-medium">
                                                    {new Date(project.FinishDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Task Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <FaClock className="text-green-500" />
                                    History
                                </h3>
                            </div>
                            <div className="p-6">
                                {activityLoading ? (
                                    <div className="text-center py-8 text-gray-400">Loading...</div>
                                ) : taskActivity.length > 0 ? (
                                    <div className="space-y-4">
                                        {taskActivity.map((activity, index) => (
                                            <div key={activity._id || index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-900 font-medium">
                                                        {formatActivityDisplay(activity)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {new Date(activity.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Pagination Controls */}
                                        <div className="flex justify-end items-center gap-2 mt-4">
                                            <button
                                                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                                                disabled={activityPage === 1}
                                                onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                                            >
                                                Prev
                                            </button>
                                            <span className="text-sm text-gray-600">
                                                Page {activityPage} of {activityTotalPages}
                                            </span>
                                            <button
                                                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                                                disabled={activityPage === activityTotalPages}
                                                onClick={() => setActivityPage(p => Math.min(activityTotalPages, p + 1))}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-sm">No activity recorded yet</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* User Story Tasks List */}
                        {task.Type === 'User Story' && (
                            <div className="px-6 pb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-md font-semibold text-gray-800 mt-4">Links</h4>
                                    <button
                                        className="ml-2 p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-colors"
                                        title="Add Task to this User Story"
                                        onClick={() => setShowAddTaskModal(true)}
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                                {userStoryTasks.length === 0 ? (
                                    <div className="text-gray-400 text-sm">No tasks found for this user story.</div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
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
                                                                className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200 block"
                                                            >
                                                                {t.Name}
                                                            </Link>
                                                            <div className="text-xs text-gray-500 mt-1">
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