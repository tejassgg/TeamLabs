import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { FaChevronRight, FaInfoCircle, FaTasks, FaExclamationCircle, FaTimes, FaCheckCircle, FaClock, FaCode, FaVial, FaShieldAlt, FaRocket, FaTrashAlt } from 'react-icons/fa';
import { useGlobal } from '../context/GlobalContext';
import { taskService } from '../services/api';
import { useToast } from '../context/ToastContext';
import React from 'react';
import AssignTaskModal from '../components/AssignTaskModal';
import { useTheme } from '../context/ThemeContext';

// Custom hook for theme-aware classes
const useThemeClasses = () => {
  const { theme } = useTheme();

  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;
  };

  return getThemeClasses;
};

// Status mapping
const statusMap = {
  1: 'Not Assigned',
  2: 'Assigned',
  3: 'In Progress',
  6: 'QA',
  7: 'Deployment',
  8: 'Completed'
};

// Status icons mapping
const statusIcons = {
  1: <FaTimes className="text-gray-500" />,
  2: <FaCheckCircle className="text-blue-500" />,
  3: <FaClock className="text-yellow-500" />,
  6: <FaShieldAlt className="text-indigo-500" />,
  7: <FaRocket className="text-pink-500" />,
  8: <FaCheckCircle className="text-green-500" />
};

// Update the status background color mapping to include dark mode variants
const statusColors = {
  1: {
    light: 'bg-gray-50',
    dark: 'bg-gray-800/50',
    textLight: 'text-gray-700',
    textDark: 'text-gray-300',
    borderLight: 'border-gray-200',
    borderDark: 'border-gray-700'
  },
  2: {
    light: 'bg-blue-50',
    dark: 'bg-blue-900/30',
    textLight: 'text-blue-700',
    textDark: 'text-blue-300',
    borderLight: 'border-blue-200',
    borderDark: 'border-blue-800/50'
  },
  3: {
    light: 'bg-yellow-50',
    dark: 'bg-yellow-900/30',
    textLight: 'text-yellow-700',
    textDark: 'text-yellow-300',
    borderLight: 'border-yellow-200',
    borderDark: 'border-yellow-800/50'
  },
  6: {
    light: 'bg-indigo-50',
    dark: 'bg-indigo-900/30',
    textLight: 'text-indigo-700',
    textDark: 'text-indigo-300',
    borderLight: 'border-indigo-200',
    borderDark: 'border-indigo-800/50'
  },
  7: {
    light: 'bg-pink-50',
    dark: 'bg-pink-900/30',
    textLight: 'text-pink-700',
    textDark: 'text-pink-300',
    borderLight: 'border-pink-200',
    borderDark: 'border-pink-800/50'
  },
  8: {
    light: 'bg-green-50',
    dark: 'bg-green-900/30',
    textLight: 'text-green-700',
    textDark: 'text-green-300',
    borderLight: 'border-green-200',
    borderDark: 'border-green-800/50'
  }
};

// Create a memoized TaskCard component to prevent unnecessary re-renders
const TaskCard = React.memo(({ task, statusCode, handleDragStart, handleDragEnd, isTaskAssignedToUser, bgColor }) => {
  const { theme } = useTheme();
  const getThemeClasses = useThemeClasses();
  const cardRef = useRef(null);
  const canMove = isTaskAssignedToUser(task);

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2); // Limit to 2 characters
  };

  // Helper function to get icon and styles for task type
  const getTaskTypeDetails = (type) => {
    switch (type) {
      case 'Bug':
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 17V7.00001C8 5.20202 8 4.30302 8.43597 3.66606C8.81947 3.10068 9.40173 2.67724 10.0858 2.4636C10.8449 2.22222 11.7476 2.45386 13.553 2.91712L18.553 4.19381C19.6884 4.47175 20.2562 4.61072 20.628 4.9568C20.9552 5.26041 21.1613 5.66725 21.2204 6.10576C21.2873 6.61029 21.0513 7.19377 20.5794 8.36072C20.2881 9.05932 20 10.1937 20 11.5V13.5C20 14.8063 20.2881 15.9407 20.5794 16.6393C21.0513 17.8062 21.2873 18.3897 21.2204 18.8942C21.1613 19.3328 20.9552 19.7396 20.628 20.0432C20.2562 20.3893 19.6884 20.5283 18.553 20.8062L13.553 22.0829C11.7476 22.5461 10.8449 22.7778 10.0858 22.5364C9.40173 22.3228 8.81947 21.8993 8.43597 21.3339C8 20.697 8 19.798 8 18.0001V17ZM17 12H12M17.5 16H12M17.5 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      case 'Feature':
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 19.0784L16.25 16.25M19.0784 4.99994L16.25 7.82838M4.92157 19.0784L7.75 16.25M4.92157 4.99994L7.75 7.82838" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'Improvement':
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'Documentation':
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          bgColor: 'bg-indigo-50',
          textColor: 'text-indigo-700',
          borderColor: 'border-indigo-200'
        };
      case 'Maintenance':
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
      case 'User Story':
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.74" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200'
        };
      default: // Default "Task" type or any other type
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Helper function to get styles for priority
  const getPriorityStyle = (priority) => {
    const styles = {
      'High': {
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      },
      'Medium': {
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      },
      'Low': {
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      }
    };

    return styles[priority] || styles['Medium']; // Default to Medium if priority not found
  };

  const typeDetails = getTaskTypeDetails(task.Type);
  const priorityDetails = task.Type !== 'User Story' ? getPriorityStyle(task.Priority) : null;

  const onDragStart = (e) => {
    if (!canMove) return;

    // Set task card dimensions to use for the placeholder
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      handleDragStart(task, e, {
        width: rect.width,
        height: rect.height,
        taskId: task.TaskID
      });
    } else {
      handleDragStart(task, e);
    }

    // This helps with drag image in some browsers
    if (e.dataTransfer.setDragImage && cardRef.current) {
      e.dataTransfer.setDragImage(cardRef.current, 20, 20);
    }
  };

  return (
    <div
      ref={cardRef}
      key={task.TaskID}
      className={getThemeClasses(
        `bg-white p-3 rounded-lg shadow-sm mb-2 border ${canMove ? `border-${bgColor.replace('bg-', '')}-200 cursor-grab` : 'border-gray-200 cursor-not-allowed opacity-80'}`,
        `dark:bg-gray-800 dark:border-gray-700 ${canMove ? 'dark:hover:bg-gray-700/50' : ''}`
      )}
      draggable={canMove}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      title={canMove ? "Drag to change status" : "You can only move tasks assigned to you"}
      data-task-id={task.TaskID}
    >
      {/* Team Name Banner with Task Type and Priority Badges */}
      <div className="flex items-center justify-between mb-2 -mt-0.5 -mx-0.5">
        {task.AssignedTo && task.AssignedToDetails?.teamName && (
          <div className={getThemeClasses(
            'px-2 py-1 bg-purple-50 text-purple-700 border-b border-purple-100 rounded-tl-lg text-xs font-medium flex items-center gap-1',
            'dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50'
          )}>
            <svg className="w-3 h-3 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
            </svg>
            {task.AssignedToDetails.teamName}
          </div>
        )}

        {/* Task Type Badge */}
        <span className={getThemeClasses(
          `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${typeDetails.bgColor} ${typeDetails.textColor} border ${typeDetails.borderColor} shadow-sm flex-shrink-0`,
          `dark:${typeDetails.bgColor.replace('bg-', 'bg-')}/30 dark:${typeDetails.textColor.replace('text-', 'text-')}/90 dark:${typeDetails.borderColor.replace('border-', 'border-')}/50`
        )}>
          {typeDetails.icon}
          {task.Type}
        </span>

      </div>

      <div className={getThemeClasses(
        'text-gray-900',
        'dark:text-gray-100'
      )}>
        <h4 className="font-medium mb-1">{task.Name}</h4>
        {task.Description && (
          <p className={getThemeClasses(
            'text-sm text-gray-600',
            'dark:text-gray-400'
          )}>
            {task.Description}
          </p>
        )}
      </div>

      {/* Task Footer */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.AssignedToDetails && (
            <div className={getThemeClasses(
              'flex items-center gap-1.5 text-xs text-gray-600',
              'dark:text-gray-400'
            )}>
              <div className={getThemeClasses(
                'w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium',
                'dark:from-blue-600 dark:to-blue-700'
              )}>
                {task.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <span>{task.AssignedToDetails.fullName}</span>
            </div>
          )}
        </div>
        {/* Priority Badge - Only show for non-User Story tasks */}
        {task.Type !== 'User Story' && task.Priority && (
          <div className="flex items-center gap-1.5">
            {(() => {
              const priorityDetails = getPriorityStyle(task.Priority);
              return (
                <span className={getThemeClasses(
                  `inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${priorityDetails.bgColor} ${priorityDetails.textColor} border ${priorityDetails.borderColor}`,
                  `dark:${priorityDetails.bgColor.replace('bg-', 'bg-')}/30 dark:${priorityDetails.textColor.replace('text-', 'text-')}/90 dark:${priorityDetails.borderColor.replace('border-', 'border-')}/50`
                )}>
                  {priorityDetails.icon}
                  {task.Priority}
                </span>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

// Create a memoized column component
const KanbanColumn = React.memo(({ statusCode, statusName, icon, bgColor, tasks, handleDragStart, handleDragEnd, handleDrop, isTaskAssignedToUser, isLast }) => {
  const { theme } = useTheme();
  const getThemeClasses = useThemeClasses();
  const tasksInStatus = tasks.filter(task => task.Status === statusCode);
  const statusStyle = statusColors[statusCode];

  return (
    <div
      className={getThemeClasses(
        `flex flex-col h-[750px] ${!isLast ? `border-r ${statusStyle.borderLight}` : ''}`,
        `dark:${!isLast ? statusStyle.borderDark : ''}`
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(statusCode)}
    >
      <div className={getThemeClasses(
        `px-4 py-3 border-b ${statusStyle.borderLight} flex items-center gap-2 sticky top-0 ${statusStyle.light}`,
        `dark:${statusStyle.borderDark} dark:${statusStyle.dark}`
      )}>
        <div className={getThemeClasses(
          statusStyle.textLight,
          `dark:${statusStyle.textDark}`
        )}>
          {icon}
        </div>
        <h3 className={getThemeClasses(
          `font-semibold ${statusStyle.textLight}`,
          `dark:${statusStyle.textDark}`
        )}>
          {statusName}
        </h3>
        <span className={getThemeClasses(
          `ml-auto px-2 py-1 ${statusStyle.light} ${statusStyle.textLight} text-xs rounded-full border ${statusStyle.borderLight}`,
          `dark:${statusStyle.dark} dark:${statusStyle.textDark} dark:${statusStyle.borderDark}`
        )}>
          {tasksInStatus.length}
        </span>
      </div>
      <div className={getThemeClasses(
        'p-3 flex-1 overflow-y-auto',
        'dark:bg-gray-800/50'
      )}>
        {tasksInStatus.map(task => (
          <TaskCard
            key={task.TaskID}
            task={task}
            statusCode={statusCode}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            isTaskAssignedToUser={isTaskAssignedToUser}
            bgColor={statusStyle.light}
          />
        ))}
        {tasksInStatus.length === 0 && (
          <div className={getThemeClasses(
            'flex flex-col items-center justify-center h-full text-gray-400',
            'dark:text-gray-500'
          )}>
            <FaTasks className="mb-2" size={24} />
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';

const KanbanBoard = () => {
  const router = useRouter();
  const { projects, userDetails } = useGlobal();
  const { showToast } = useToast();
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggingTask, setDraggingTask] = useState(null);
  const [targetStatus, setTargetStatus] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteArea, setShowDeleteArea] = useState(false);
  const [isOverDeleteArea, setIsOverDeleteArea] = useState(false);
  const [draggedCardDimensions, setDraggedCardDimensions] = useState(null);
  const { theme } = useTheme();
  const getThemeClasses = useThemeClasses();

  // Initialize with first project when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].ProjectID || projects[0]._id);
    }
  }, [projects, selectedProject]);

  // Fetch tasks when a project is selected
  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedProject) return;

      setLoading(true);
      try {
        const fetchedTasks = await taskService.getTaskDetails(selectedProject);

        // Map any tasks with removed statuses to appropriate fallback statuses
        const mappedTasks = fetchedTasks.map(task => {
          // Map Development (4) and Testing (5) to In Progress (3)
          if (task.Status === 4 || task.Status === 5) {
            return { ...task, Status: 3 };
          }
          return task;
        });

        // Smooth transition: fade out old tasks, then update with new ones
        setTasks(mappedTasks);
      } catch (err) {
        setError('Failed to fetch tasks');
        showToast('Failed to fetch tasks', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [selectedProject]);

  // Handle project selection change
  const handleProjectChange = (e) => {
    const newProjectId = e.target.value;
    if (newProjectId !== selectedProject) {
      setSelectedProject(newProjectId);
    }
  };

  // Function to check if a task is assigned to the current user
  const isTaskAssignedToUser = (task) => {
    return task.Assignee === userDetails?._id;
  };

  // Function to handle starting dragging a task
  const handleDragStart = (task, event, dimensions = null) => {
    // Allow moving unassigned tasks (Status 1) for any user
    if (task.Status === 1 || isTaskAssignedToUser(task)) {
      setDraggingTask(task);
      setShowDeleteArea(true);

      // Store dimensions for placeholder
      if (dimensions) {
        const rect = event.currentTarget.getBoundingClientRect();
        setDraggedCardDimensions({
          ...dimensions,
          left: rect.left,
          top: rect.top
        });
      }
    } else {
      event.preventDefault();
      showToast("You can only move tasks assigned to you", 'warning');
      return;
    }
  };

  // Function to handle drag end (cleanup)
  const handleDragEnd = () => {
    setShowDeleteArea(false);
    setIsOverDeleteArea(false);
    setDraggedCardDimensions(null);
  };

  // Function to handle dropping a task into a column
  const handleDrop = async (statusCode) => {
    if (!draggingTask || draggingTask.Status === statusCode) {
      setDraggingTask(null);
      setShowDeleteArea(false);
      return;
    }

    // If dragging from "Not Assigned" status (1) to any other status,
    // show the assign modal first
    if (draggingTask.Status === 1) {
      setTargetStatus(statusCode);
      setShowAssignModal(true);
      setShowDeleteArea(false);
      return;
    }

    // Otherwise, proceed with the normal status update
    await updateTaskStatus(draggingTask, statusCode);
    setShowDeleteArea(false);
  };

  // Function to handle dropping a task in the delete area
  const handleDeleteDrop = async () => {
    if (!draggingTask) return;

    try {
      // Call API deleting the task
      await taskService.deleteTask(draggingTask.TaskID);

      // Update local state by removing the task
      const updatedTasks = tasks.filter(task => task.TaskID !== draggingTask.TaskID);
      setTasks(updatedTasks);

      showToast('Task removed successfully', 'success');
    } catch (err) {
      showToast('Failed to remove task', 'error');
    }

    setDraggingTask(null);
    setShowDeleteArea(false);
    setIsOverDeleteArea(false);
  };

  // Function to handle dragover on delete area
  const handleDeleteDragOver = (e) => {
    e.preventDefault();
    setIsOverDeleteArea(true);
  };

  // Function to handle dragleave on delete area
  const handleDeleteDragLeave = () => {
    setIsOverDeleteArea(false);
  };

  // Function to update task status
  const updateTaskStatus = async (task, statusCode) => {
    // Optimistically update UI
    const updatedTasks = tasks.map(t =>
      t.TaskID === task.TaskID
        ? { ...t, Status: statusCode }
        : t
    );
    setTasks(updatedTasks);

    try {
      // Call API to update task status
      await taskService.updateTaskStatus(task.TaskID, statusCode);
      showToast(`Task moved to ${statusMap[statusCode]}`, 'success');
    } catch (err) {
      // Revert changes if API call fails
      const originalTasks = tasks.map(t =>
        t.TaskID === task.TaskID
          ? task
          : t
      );
      setTasks(originalTasks);
      showToast('Failed to update task status', 'error');
    }

    setDraggingTask(null);
  };

  // Handle task assignment and status update
  const handleAssignTask = (updatedTask) => {
    const updatedTasks = tasks.map(task =>
      task.TaskID === updatedTask.TaskID
        ? {
          ...updatedTask,
          Status: targetStatus // Use the target status that was set when dropping
        }
        : task
    );
    setTasks(updatedTasks);

    // Update the status after assignment is complete
    taskService.updateTaskStatus(updatedTask.TaskID, targetStatus)
      .then(() => {
        showToast(`Task assigned and moved to ${statusMap[targetStatus]}`, 'success');
      })
      .catch((err) => {
        showToast('Failed to update task status', 'error');
      });

    // Reset state
    setDraggingTask(null);
    setTargetStatus(null);
  };

  // Get current project name
  const getCurrentProjectName = () => {
    if (!selectedProject || !projects.length) return 'Loading...';
    const project = projects.find(p => (p.ProjectID || p._id) === selectedProject);
    return project ? project.Name : 'Unknown Project';
  };

  return (
    <Layout>
      <Head>
        <title>Kanban Board | TeamLabs</title>
      </Head>
      <div className="mx-auto">
        {/* Breadcrumb Navigation */}
        <div className={getThemeClasses(
          'flex items-center text-sm text-gray-500 mb-4',
          'dark:text-gray-400'
        )}>
          <Link href="/dashboard" className={getThemeClasses(
            'hover:text-blue-600 transition-colors',
            'dark:hover:text-blue-400'
          )}>
            Dashboard
          </Link>
          <FaChevronRight className="mx-2" size={12} />
          <span className={getThemeClasses(
            'text-gray-700 font-medium',
            'dark:text-gray-300'
          )}>Kanban Board</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className={getThemeClasses(
            'text-2xl font-bold text-gray-900',
            'dark:text-gray-100'
          )}>Kanban Board</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedProject || ''}
              onChange={handleProjectChange}
              className={getThemeClasses(
                'border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                projects.map(project => (
                  <option key={project.ProjectID || project._id} value={project.ProjectID || project._id}>
                    {project.Name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Project Info Banner */}
        <div className={getThemeClasses(
          'bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 flex items-center gap-3 border border-blue-100',
          'dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-800/50'
        )}>
          <FaInfoCircle className={getThemeClasses(
            'text-blue-500',
            'dark:text-blue-400'
          )} size={20} />
          <div>
            <p className={getThemeClasses(
              'text-gray-700',
              'dark:text-gray-300'
            )}>
              Currently viewing: <span className="font-semibold">{getCurrentProjectName()}</span>
            </p>
            <p className={getThemeClasses(
              'text-sm text-gray-600',
              'dark:text-gray-400'
            )}>Drag and drop tasks to update their status</p>
          </div>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className={getThemeClasses(
              'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500',
              'dark:border-blue-400'
            )}></div>
          </div>
        ) : error && tasks.length === 0 ? (
          <div className={getThemeClasses(
            'text-center py-16 text-red-500 flex flex-col items-center',
            'dark:text-red-400'
          )}>
            <FaExclamationCircle size={48} className="mb-4" />
            <p>{error}</p>
          </div>
        ) : (
          <div className={getThemeClasses(
            'bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden',
            'dark:bg-gray-800 dark:border-gray-700'
          )}>
            <div className={getThemeClasses(
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 divide-x divide-gray-200',
              'dark:divide-gray-700'
            )}>
              {Object.entries(statusMap).map(([statusCode, statusName], index, arr) => {
                const status = parseInt(statusCode);
                const icon = statusIcons[status];
                const statusStyle = statusColors[status];
                const isLast = index === arr.length - 1;

                return (
                  <KanbanColumn
                    key={statusCode}
                    statusCode={status}
                    statusName={statusName}
                    icon={icon}
                    bgColor={statusStyle.light}
                    tasks={tasks}
                    handleDragStart={handleDragStart}
                    handleDragEnd={handleDragEnd}
                    handleDrop={handleDrop}
                    isTaskAssignedToUser={isTaskAssignedToUser}
                    isLast={isLast}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Show loading indicator while fetching new project tasks */}
        {loading && tasks.length > 0 && (
          <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Dragging card placeholder - only visible when a card is being dragged */}
        {draggingTask && draggedCardDimensions && (
          <div className="pointer-events-none fixed top-0 left-0 w-full h-full z-40">
            <div
              className="absolute transition-all duration-200"
              style={{
                width: `${draggedCardDimensions.width}px`,
                height: `${draggedCardDimensions.height}px`,
                left: `${draggedCardDimensions.left}px`,
                top: `${draggedCardDimensions.top}px`,
                transform: 'scale(0.98)'
              }}
            >
              <div
                className="w-full h-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 flex flex-col items-center justify-center overflow-hidden"
              >
                <div className="flex items-center justify-center flex-1 w-full">
                  <svg className="w-6 h-6 text-blue-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Area - visible only when dragging */}
        {showDeleteArea && (
          <div
            className="fixed bottom-0 left-0 right-0 transition-all duration-500 flex items-center justify-center z-50 overflow-hidden"
            style={{
              height: isOverDeleteArea ? '10rem' : '8rem',
              background: isOverDeleteArea
                ? 'linear-gradient(to top, #dc2626, #ef4444, #fee2e2)'
                : 'linear-gradient(to top, #ef4444, #fca5a5, #fef2f2)',
              boxShadow: isOverDeleteArea
                ? '0 -10px 30px -5px rgba(220, 38, 38, 0.3)'
                : '0 -5px 15px -5px rgba(220, 38, 38, 0.15)'
            }}
            onDragOver={handleDeleteDragOver}
            onDragLeave={handleDeleteDragLeave}
            onDrop={(e) => {
              e.preventDefault();
              handleDeleteDrop();
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              {/* SVG accent patterns */}
              <svg width="100%" height="100%" className="absolute top-0 left-0 opacity-10">
                <pattern id="pattern-circles" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                  <circle id="pattern-circle" cx="10" cy="10" r="5" fill="none" stroke="#FFF" strokeWidth="1" />
                </pattern>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
              </svg>

              {/* Animated particles */}
              <div className="absolute top-0 left-0 w-full h-full">
                {isOverDeleteArea && Array.from({ length: 15 }).map((_, i) => {
                  const size = Math.random() * 8 + 4;
                  const left = Math.random() * 100;
                  const delay = Math.random() * 2;
                  const duration = Math.random() * 3 + 2;

                  return (
                    <div
                      key={i}
                      className="absolute bg-white rounded-full opacity-40"
                      style={{
                        width: size + 'px',
                        height: size + 'px',
                        left: left + '%',
                        bottom: '-20px',
                        animation: `float ${duration}s ease-in ${delay}s infinite`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Background light effect */}
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at center, rgba(254, 202, 202, 0.2) 0%, transparent 70%)',
                  opacity: isOverDeleteArea ? 1 : 0.5
                }}
              />
            </div>

            {/* Ripple animation when hovering */}
            {isOverDeleteArea && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="absolute inline-flex h-32 w-32 animate-ping rounded-full bg-red-400 opacity-20" style={{ animationDuration: '2s' }}></span>
                <span className="absolute inline-flex h-24 w-24 animate-ping rounded-full bg-red-500 opacity-20" style={{ animationDuration: '2.5s', animationDelay: '0.2s' }}></span>
                <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-red-600 opacity-20" style={{ animationDuration: '2.2s', animationDelay: '0.4s' }}></span>
              </div>
            )}

            <div
              className="relative flex flex-col items-center justify-center transition-all duration-500"
              style={{
                transform: isOverDeleteArea ? 'scale(1.15)' : 'scale(1)',
                filter: isOverDeleteArea ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))' : 'none'
              }}
            >
              <div
                className="relative flex items-center justify-center rounded-full mb-3 transition-all duration-300"
                style={{
                  width: isOverDeleteArea ? '4rem' : '3.5rem',
                  height: isOverDeleteArea ? '4rem' : '3.5rem',
                  background: isOverDeleteArea ?
                    'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' :
                    'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                  boxShadow: isOverDeleteArea ?
                    '0 0 20px rgba(220, 38, 38, 0.7), inset 0 0 10px rgba(254, 202, 202, 0.3)' :
                    '0 0 10px rgba(220, 38, 38, 0.3), inset 0 0 5px rgba(254, 202, 202, 0.1)'
                }}
              >
                <FaTrashAlt
                  className="text-white transition-all"
                  style={{
                    fontSize: isOverDeleteArea ? '1.75rem' : '1.5rem',
                    filter: isOverDeleteArea ? 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.5))' : 'none'
                  }}
                />

                {/* Pulsing indicator */}
                {isOverDeleteArea && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-white"></span>
                  </span>
                )}
              </div>

              <div className="text-center flex flex-col items-center">
                <span
                  className="font-semibold tracking-wide transition-all text-white"
                  style={{
                    fontSize: isOverDeleteArea ? '1.25rem' : '1.125rem',
                    letterSpacing: isOverDeleteArea ? '0.05em' : 'normal',
                    textShadow: isOverDeleteArea ? '0 0 10px rgba(254, 202, 202, 0.5)' : 'none'
                  }}
                >
                  Drop to Delete
                </span>
                <span
                  className="text-xs text-white mt-1 transition-all"
                  style={{
                    opacity: isOverDeleteArea ? 1 : 0.8,
                    maxHeight: isOverDeleteArea ? '30px' : '20px',
                    transform: isOverDeleteArea ? 'translateY(0)' : 'translateY(-5px)'
                  }}
                >
                  Task will be permanently removed
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Style for float animation */}
        <style jsx global>{`
          @keyframes float {
            0% { transform: translateY(0); opacity: 0; }
            20% { opacity: 0.6; }
            100% { transform: translateY(-120px); opacity: 0; }
          }
        `}</style>

        {/* Assignment Modal */}
        <AssignTaskModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setDraggingTask(null);
            setTargetStatus(null);
          }}
          task={draggingTask}
          projectId={selectedProject}
          onAssignTask={handleAssignTask}
        />

        {/* Instructions */}
        <div className={getThemeClasses(
          'mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200',
          'dark:bg-gray-800/50 dark:border-gray-700'
        )}>
          <h3 className={getThemeClasses(
            'font-semibold mb-2 text-gray-800',
            'dark:text-gray-200'
          )}>How to use the Kanban Board:</h3>
          <ul className={getThemeClasses(
            'list-disc ml-5 text-gray-700 space-y-1',
            'dark:text-gray-300'
          )}>
            <li>Select a project from the dropdown menu</li>
            <li>Drag tasks between columns to update their status</li>
            <li>Click on a task to view more details</li>
          </ul>
          <div className={getThemeClasses(
            'mt-4 text-sm text-gray-500',
            'dark:text-gray-400'
          )}>
            <p>Note: This Kanban board uses native HTML5 drag and drop functionality. For enhanced UI experience, you may need to install react-beautiful-dnd or similar packages.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KanbanBoard;
