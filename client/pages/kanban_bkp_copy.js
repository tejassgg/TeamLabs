import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { FaChevronRight, FaInfoCircle, FaTasks, FaExclamationCircle, FaTimes, FaCheckCircle, FaClock, FaCode, FaVial, FaShieldAlt, FaRocket } from 'react-icons/fa';
import { useGlobal } from '../context/GlobalContext';
import { taskService } from '../services/api';
import { toast } from 'react-toastify';
import React from 'react';

// Status mapping
const statusMap = {
  1: 'Not Assigned',
  2: 'Assigned',
  3: 'In Progress',
  4: 'Development',
  5: 'Testing',
  6: 'QA',
  7: 'Deployment',
  8: 'Completed'
};

// Status icons mapping
const statusIcons = {
  1: <FaTimes className="text-gray-500" />,
  2: <FaCheckCircle className="text-blue-500" />,
  3: <FaClock className="text-yellow-500" />,
  4: <FaCode className="text-purple-500" />,
  5: <FaVial className="text-orange-500" />,
  6: <FaShieldAlt className="text-indigo-500" />,
  7: <FaRocket className="text-pink-500" />,
  8: <FaCheckCircle className="text-green-500" />
};

// Status background color mapping
const statusColors = {
  1: 'bg-gray-50',
  2: 'bg-blue-50',
  3: 'bg-yellow-50',
  4: 'bg-purple-50',
  5: 'bg-orange-50',
  6: 'bg-indigo-50',
  7: 'bg-pink-50',
  8: 'bg-green-50'
};

// Create a memoized TaskCard component to prevent unnecessary re-renders
const TaskCard = React.memo(({ task, statusCode, handleDragStart, isTaskAssignedToUser, bgColor }) => {
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
    switch(type) {
      case 'Bug':
        return { 
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 17V7.00001C8 5.20202 8 4.30302 8.43597 3.66606C8.81947 3.10068 9.40173 2.67724 10.0858 2.4636C10.8449 2.22222 11.7476 2.45386 13.553 2.91712L18.553 4.19381C19.6884 4.47175 20.2562 4.61072 20.628 4.9568C20.9552 5.26041 21.1613 5.66725 21.2204 6.10576C21.2873 6.61029 21.0513 7.19377 20.5794 8.36072C20.2881 9.05932 20 10.1937 20 11.5V13.5C20 14.8063 20.2881 15.9407 20.5794 16.6393C21.0513 17.8062 21.2873 18.3897 21.2204 18.8942C21.1613 19.3328 20.9552 19.7396 20.628 20.0432C20.2562 20.3893 19.6884 20.5283 18.553 20.8062L13.553 22.0829C11.7476 22.5461 10.8449 22.7778 10.0858 22.5364C9.40173 22.3228 8.81947 21.8993 8.43597 21.3339C8 20.697 8 19.798 8 18.0001V17ZM17 12H12M17.5 16H12M17.5 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
              <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 19.0784L16.25 16.25M19.0784 4.99994L16.25 7.82838M4.92157 19.0784L7.75 16.25M4.92157 4.99994L7.75 7.82838" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.74" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  const typeDetails = getTaskTypeDetails(task.Type);
  
  return (
    <div
      key={task.TaskID}
      className={`bg-white p-3 rounded-lg shadow-sm mb-2 border ${canMove
        ? `border-${bgColor.replace('bg-', '')}-200 cursor-grab` 
        : 'border-gray-200 cursor-not-allowed opacity-80'
      }`}
      draggable={canMove}
      onDragStart={(e) => handleDragStart(task, e)}
      title={canMove ? "Drag to change status" : "You can only move tasks assigned to you"}
    >
      {/* Team Name Banner - Show at top if available */}
      {task.AssignedTo && task.AssignedToDetails?.teamName && (
        <div className="mb-2 -mt-0.5 -mx-0.5 px-2 py-1 bg-purple-50 text-purple-700 border-b border-purple-100 rounded-t-lg text-xs font-medium flex items-center gap-1">
          <svg className="w-3 h-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
          </svg>
          {task.AssignedToDetails.teamName}
        </div>
      )}

      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Header with task name and type badge */}
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-gray-800 break-words pr-2">{task.Name}</h3>
            <div className="flex items-center flex-shrink-0">
              {/* Task Type Badge */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${typeDetails.bgColor} ${typeDetails.textColor} border ${typeDetails.borderColor} shadow-sm flex-shrink-0`}>
                {typeDetails.icon}
                {task.Type}
              </span>
              {!canMove && (
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                  Locked
                </span>
              )}
            </div>
          </div>
          
          {/* Task description - full text */}
          <div className="mt-2 mb-3 text-sm text-gray-600 whitespace-pre-line">{task.Description}</div>
          
          {/* Footer with assignee initials at bottom left */}
          <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
            {/* Assignee Badge with Initials */}
            {task.Assignee && task.AssigneeDetails ? (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center bg-blue-500 text-white rounded-full w-5 h-5 text-xs font-medium">
                  {getInitials(task.AssigneeDetails.fullName)}
                </span>
                <span className="text-xs text-gray-500">Assignee</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center bg-gray-200 text-gray-500 rounded-full w-5 h-5 text-xs font-medium">
                  NA
                </span>
                <span className="text-xs text-gray-500">Not Assigned</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

// Create a memoized column component
const KanbanColumn = React.memo(({ statusCode, statusName, icon, bgColor, tasks, handleDragStart, handleDrop, isTaskAssignedToUser, isLast }) => {
  const tasksInStatus = tasks.filter(task => task.Status === statusCode);

  return (
    <div
      className={`flex flex-col h-[600px] ${!isLast ? 'border-r border-gray-300 dark:border-gray-700' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(statusCode)}
    >
      <div className={`p-3 border-b border-gray-200 flex items-center gap-2 sticky top-0 ${bgColor}`}>
        {icon}
        <h3 className={`font-semibold text-${bgColor.replace('bg-', '')}-700`}>{statusName}</h3>
        <span className={`ml-auto px-2 py-1 bg-${bgColor.replace('bg-', '')}-200 text-${bgColor.replace('bg-', '')}-700 text-xs rounded-full`}>
          {tasksInStatus.length}
        </span>
      </div>
      <div className="p-2 flex-1 overflow-y-auto">
        {tasksInStatus.map(task => (
          <TaskCard
            key={task.TaskID}
            task={task}
            statusCode={statusCode}
            handleDragStart={handleDragStart}
            isTaskAssignedToUser={isTaskAssignedToUser}
            bgColor={bgColor}
          />
        ))}
        {tasksInStatus.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
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
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggingTask, setDraggingTask] = useState(null);

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
        // Smooth transition: fade out old tasks, then update with new ones
        setTasks(prevTasks => {
          // Mark tasks for removal with a fade-out animation if needed
          return fetchedTasks;
        });
      } catch (err) {
        setError('Failed to fetch tasks');
        toast.error('Failed to fetch tasks');
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

  // Function to handle starting dragging a task - only allow if assigned to user
  const handleDragStart = (task, event) => {
    if (!isTaskAssignedToUser(task)) {
      event.preventDefault();
      toast.warning("You can only move tasks assigned to you");
      return;
    }
    setDraggingTask(task);
  };

  // Function to handle dropping a task into a column
  const handleDrop = async (statusCode) => {
    if (!draggingTask || draggingTask.Status === statusCode) {
      setDraggingTask(null);
      return;
    }

    // Optimistically update UI
    const updatedTasks = tasks.map(task =>
      task.TaskID === draggingTask.TaskID
        ? { ...task, Status: statusCode }
        : task
    );
    setTasks(updatedTasks);

    try {
      // Call API to update task status
      await taskService.updateTaskStatus(draggingTask.TaskID, statusCode);
      toast.success(`Task moved to ${statusMap[statusCode]}`);
    } catch (err) {
      // Revert changes if API call fails
      const originalTasks = tasks.map(task =>
        task.TaskID === draggingTask.TaskID
          ? draggingTask
          : task
      );
      setTasks(originalTasks);
      toast.error('Failed to update task status');
    }

    setDraggingTask(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedProject || ''}
              onChange={handleProjectChange}
              className="border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 flex items-center gap-3 border border-blue-100">
          <FaInfoCircle className="text-blue-500" size={20} />
          <div>
            <p className="text-gray-700">
              Currently viewing: <span className="font-semibold">{getCurrentProjectName()}</span>
            </p>
            <p className="text-sm text-gray-600">Drag and drop tasks to update their status</p>
          </div>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error && tasks.length === 0 ? (
          <div className="text-center py-16 text-red-500 flex flex-col items-center">
            <FaExclamationCircle size={48} className="mb-4" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 divide-x divide-gray-200">
              {Object.entries(statusMap).map(([statusCode, statusName], index, arr) => {
                const status = parseInt(statusCode);
                const icon = statusIcons[status];
                const bgColor = statusColors[status];
                const isLast = index === arr.length - 1;

                return (
                  <KanbanColumn
                    key={statusCode}
                    statusCode={status}
                    statusName={statusName}
                    icon={icon}
                    bgColor={bgColor}
                    tasks={tasks}
                    handleDragStart={handleDragStart}
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

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-2 text-gray-800">How to use the Kanban Board:</h3>
          <ul className="list-disc ml-5 text-gray-700 space-y-1">
            <li>Select a project from the dropdown menu</li>
            <li>Drag tasks between columns to update their status</li>
            <li>Click on a task to view more details</li>
          </ul>
          <div className="mt-4 text-sm text-gray-500">
            <p>Note: This Kanban board uses native HTML5 drag and drop functionality. For enhanced UI experience, you may need to install react-beautiful-dnd or similar packages.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KanbanBoard;
