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
                        {/* --- TOP SECTION --- */}
                        <div className="mb-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <h1 className={getThemeClasses("text-3xl md:text-4xl font-bold text-gray-900 truncate", "dark:text-gray-100")}>{task.Name}</h1>
                                    {task.Status !== undefined && (
                                        <span className={`ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm ${statusColors[task.Status]?.light || 'bg-gray-50'} ${statusColors[task.Status]?.textLight || 'text-gray-700'} ${statusColors[task.Status]?.borderLight || 'border-gray-200'}`}>{statusIcons[task.Status]} {statusMap[task.Status] || 'Unknown'}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {task.DueDate && (
                                        <span className={getThemeClasses(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200",
                                            "dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50"
                                        )}>
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            {(() => {
                                                // Calculate days left
                                                const due = new Date(task.DueDate);
                                                const now = new Date();
                                                const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                                                return diff >= 0 ? `${diff} Days Left` : 'Overdue';
                                            })()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {task.Description && (
                                <div className={getThemeClasses("mt-2 text-base text-gray-500", "dark:text-gray-400")}>{task.Description}</div>
                            )}
                            {/* Tabs Row */}
                            <div className="flex items-center gap-6 mt-6 border-b border-gray-200 dark:border-gray-700">
                                <button className={getThemeClasses(
                                    "pb-2 text-blue-600 font-medium border-b-2 border-blue-600 transition-all duration-200",
                                    "dark:text-blue-400 dark:border-blue-400"
                                )}>
                                    <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7V6a2 2 0 012-2h2a2 2 0 012 2v1m0 0v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7h6zm0 0h6m0 0V6a2 2 0 012-2h2a2 2 0 012 2v1m0 0v10a2 2 0 01-2 2h-2a2 2 0 01-2-2V7h6z" /></svg>Manage Project</span>
                                </button>
                                <button className={getThemeClasses(
                                    "pb-2 text-gray-500 font-medium border-b-2 border-transparent hover:text-blue-600 hover:border-blue-600 transition-all duration-200",
                                    "dark:text-gray-400 dark:hover:text-blue-400 dark:hover:border-blue-400"
                                )}>
                                    <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg>Board</span>
                                </button>
                            </div>
                        </div>
                        {/* --- END TOP SECTION --- */}

                        {/* --- ATTACHMENTS SECTION --- */}
                        <div className="mb-10">
                            <h2 className={getThemeClasses("text-xl font-semibold mb-4 text-gray-900", "dark:text-gray-100")}>Attachments</h2>
                            <TaskAttachments taskId={task.TaskID} userId={userDetails?._id} initialAttachments={attachments} />
                        </div>
                        {/* Divider between Attachments and Comments */}
                        <div className={getThemeClasses("border-t border-gray-200 mb-10", "dark:border-gray-700")}></div>
                        {/* --- COMMENTS SECTION --- */}
                        <div>
                            <h2 className={getThemeClasses("text-xl font-semibold mb-4 text-gray-900", "dark:text-gray-100")}>Comments</h2>
                            <TaskComments
                                taskId={task.TaskID}
                                userId={userDetails?._id}
                                userName={userDetails?.fullName || userDetails?.username || 'User'}
                                initialComments={comments}
                                projectMembers={projectMembers}
                            />
                        </div>
                    </div>
                    {/* Right Column - Project Info & Actions */}
                    <div className="space-y-10">
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
                                        "dark:text-gray-500"
                                    )}>Loading...</div>
                                ) : taskActivity.length > 0 ? (
                                    <div className="space-y-4">
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
                                                "dark:text-gray-400"
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
                                            "dark:text-gray-500"
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
                                        "dark:text-gray-500"
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