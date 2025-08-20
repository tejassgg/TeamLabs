import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { FaChevronRight, FaInfoCircle, FaTasks, FaExclamationCircle, FaTimes, FaCheckCircle, FaClock, FaCode, FaVial, FaShieldAlt, FaRocket, FaTrashAlt, FaProjectDiagram } from 'react-icons/fa';
import { useGlobal } from '../context/GlobalContext';
import { taskService, projectService, commentService, attachmentService } from '../services/api';
import { useToast } from '../context/ToastContext';
import React from 'react';
import { connectSocket, subscribe, getSocket } from '../services/socket';
import AssignTaskModal from '../components/AssignTaskModal';
import { useTheme } from '../context/ThemeContext';
import AddTaskModal from '../components/AddTaskModal';
import TaskCard from '../components/TaskCard';
import KanbanColumn from '../components/KanbanColumn';
import CustomDropdown from '../components/CustomDropdown';
import {
  statusMap,
  statusIcons,
  statusColors,
  getTaskTypeDetails,
  getPriorityStyle,
  useThemeClasses
} from '../components/kanbanUtils';


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
  const [userStories, setUserStories] = useState([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const { theme } = useTheme();
  const getThemeClasses = useThemeClasses();

  // Initialize with first project when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].ProjectID || projects[0]._id);
    }
  }, [projects, selectedProject]);

  // Fetch tasks and user stories when a project is selected
  useEffect(() => {
    const fetchTasksAndUserStories = async () => {
      if (!selectedProject) return;
      setLoading(true);
      try {
        const fetchedTasks = await taskService.getTaskDetails(selectedProject);

        setTasks(fetchedTasks);
        // Fetch user stories for the project
        const projectDetails = await projectService.getProjectDetails(selectedProject);
        setUserStories(projectDetails.userStories || []);
      } catch (err) {
        setError('Failed to fetch tasks');
        showToast('Failed to fetch tasks', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTasksAndUserStories();
    // Join project room for live updates
    if (selectedProject) {
      connectSocket();
      try { getSocket().emit('project.join', { projectId: selectedProject }); } catch (_) {}
    }
    return () => {
      if (selectedProject) {
        try { getSocket().emit('project.leave', { projectId: selectedProject }); } catch (_) {}
      }
    };
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

  // Live kanban subscriptions
  useEffect(() => {
    if (!selectedProject) return;
    const offCreated = subscribe('kanban.task.created', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== selectedProject) return;
      setTasks((prev) => {
        if (prev.find(t => t.TaskID === data.task.TaskID)) return prev;
        return [...prev, data.task];
      });
    });
    const offUpdated = subscribe('kanban.task.updated', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== selectedProject) return;
      const task = data.task;
      setTasks((prev) => prev.map(t => t.TaskID === task.TaskID ? { ...t, ...task } : t));
    });
    const offStatus = subscribe('kanban.task.status.updated', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== selectedProject) return;
      setTasks((prev) => prev.map(t => t.TaskID === data.taskId ? { ...t, Status: data.status } : t));
    });
    const offDeleted = subscribe('kanban.task.deleted', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== selectedProject) return;
      setTasks((prev) => prev.filter(t => t.TaskID !== data.taskId));
    });
    const offAssigned = subscribe('kanban.task.assigned', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== selectedProject) return;
      setTasks((prev) => prev.map(t => t.TaskID === data.taskId ? { ...t, AssignedTo: data.assignedTo, Status: data.status } : t));
    });
    return () => {
      offCreated && offCreated();
      offUpdated && offUpdated();
      offStatus && offStatus();
      offDeleted && offDeleted();
      offAssigned && offAssigned();
    };
  }, [selectedProject]);

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
        // Don't show success message here since assignment already shows one
        // showToast(`Task assigned and moved to ${statusMap[targetStatus]}`, 'success');
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

        <div className="flex items-center justify-between mb-6">
          <h1 className={getThemeClasses("text-3xl font-bold text-gray-900", "dark:text-white")}>
            Kanban Board
          </h1>
          <div className="flex items-center gap-4">
            <CustomDropdown
              value={selectedProject || ''}
              onChange={handleProjectChange}
              options={projects.length === 0 ? [] : projects.map(project => ({
                value: project.ProjectID || project._id,
                label: project.Name,
                icon: <FaProjectDiagram className="w-4 h-4" />
              }))}
              placeholder={projects.length === 0 ? "No projects available" : "Select a project"}
              disabled={projects.length === 0}
              // icon={<FaProjectDiagram className="w-4 h-4" />}
              variant="filled"
              size="md"
              width="w-64"
            />
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
            'rounded-xl border border-gray-200 overflow-hidden',
            'dark:border-gray-700'
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
                // Only for Not Assigned column (status 1), pass the Add New Task button as a prop
                const addTaskButton = status === 1 ? (
                  <div className="mt-2">
                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-4 border border-gray-200 rounded-lg text-gray-500 font-semibold text-base transition hover:bg-gray-50/50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ minHeight: '64px' }}
                      onClick={() => setShowAddTaskModal(true)}
                    >
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>Add New Task
                    </button>
                  </div>
                ) : null;
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
                    addTaskButton={addTaskButton}
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

        {/* AddTaskModal for Not Assigned column */}
        <AddTaskModal
          isOpen={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          onAddTask={async (taskData) => {
            try {
              const newTask = await taskService.addTaskDetails(taskData, 'fromProject');
              // setTasks(prev => [...prev, newTask]);
              setShowAddTaskModal(false);
              showToast('Task added successfully', 'success');
            } catch (err) {
              showToast('Failed to add task', 'error');
            }
          }}
          mode="fromProject"
          projectIdDefault={selectedProject}
          userStories={userStories}
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
            'dark:text-gray-400'
          )}>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KanbanBoard;
