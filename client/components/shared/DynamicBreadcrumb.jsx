import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaChevronRight, FaEdit } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { useTheme } from '../../context/ThemeContext';

const DynamicBreadcrumb = ({ 
  teams, 
  projects, 
  tasksDetails, 
  currentPageProject,
  onEditProjectName,
  onEditTaskName,
  onSaveProjectName,
  onSaveTaskName,
  onCancelEdit,
  editingProjectId,
  editingTaskId,
  editingProjectName,
  editingTaskName,
  setEditingProjectName,
  setEditingTaskName
}) => {
  const router = useRouter();
  const { theme } = useTheme();

  const getBreadcrumbItems = () => {
    const path = router.pathname;
    const query = router.query;

    // Dashboard
    if (path === '/dashboard') {
      return [{ label: 'Dashboard', href: '/dashboard', isCurrent: true }];
    }

    // Kanban Board
    if (path === '/kanban') {
      return [{ label: 'Kanban Board', href: '/kanban', isCurrent: true }];
    }

    // Profile
    if (path === '/profile') {
      return [{ label: 'Profile', href: '/profile', isCurrent: true }];
    }

    // Settings
    if (path === '/settings') {
      return [{ label: 'Settings', href: '/settings', isCurrent: true }];
    }

    // Messages
    if (path === '/messages') {
      return [{ label: 'Messages', href: '/messages', isCurrent: true }];
    }

    // Team Details
    if (path === '/team/[teamId]') {
      const teamId = query.teamId;
      const team = teams?.find(t => t.TeamID === teamId || t._id === teamId);
      return [
        { label: 'Teams', href: '/dashboard' },
        { label: team?.TeamName || 'Team Details', href: router.asPath, isCurrent: true }
      ];
    }

    // Project Details
    if (path === '/project/[projectId]') {
      const projectId = query.projectId;
      const project = projects?.find(p => p.ProjectID === projectId || p._id === projectId);
      return [
        { label: 'Projects', href: '/dashboard' },
        {
          label: project?.Name || 'Project Details',
          href: router.asPath,
          isCurrent: true,
          isProject: true,
          project: project
        }
      ];
    }

    // Task Details
    if (path === '/task/[taskId]') {
      const taskId = query.taskId;
      const task = tasksDetails?.find(t => t.TaskID === taskId || t._id === taskId);

      // Use currentPageProject if available, otherwise fall back to global context
      let project = currentPageProject;
      if (!project) {
        project = task ? projects?.find(p => p.ProjectID === task.ProjectID_FK || p._id === task.ProjectID_FK) : null;
      }

      // Enhanced project name detection
      let projectName = 'Project Details';
      let projectHref = '/dashboard';

      if (project?.Name) {
        projectName = project.Name;
        projectHref = `/project/${project.ProjectID || project._id}`;
      } else if (task?.ProjectID_FK) {
        // If we have a project ID but no name, show a more descriptive fallback
        projectName = 'Project Details';
        projectHref = `/project/${task.ProjectID_FK}`;
      }

      return [
        { label: 'Projects', href: '/dashboard' },
        {
          label: projectName,
          href: projectHref,
          isProject: true,
          project: project
        },
        {
          label: task?.Name || 'Task Details',
          href: router.asPath,
          isCurrent: true,
          isTask: true,
          task: task
        }
      ];
    }

    // Payment
    if (path === '/payment') {
      return [{ label: 'Payment', href: '/payment', isCurrent: true }];
    }

    // Default
    return [{ label: 'Dashboard', href: '/dashboard' }];
  };

  const items = getBreadcrumbItems();

  if (items.length <= 1) return null;

  return (
    <nav className={`flex items-center space-x-2 text-sm h-8 x-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <FaChevronRight className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />}

          {/* Project Name with Edit Functionality - Only editable when not on task details page */}
          {item.isProject && !item.isCurrent ? (
            <div className="flex items-center gap-1">
              <Link
                href={item.href}
                className={`hover:text-blue-600 transition-colors duration-200 ${theme === 'dark' ? 'hover:text-blue-400' : ''}`}
              >
                {item.label}
              </Link>
              {/* Only show edit button if not on task details page */}
              {!router.pathname.startsWith('/task/') && (
                <button
                  onClick={() => onEditProjectName(item.project)}
                  className={`breadcrumb-edit-button p-1 rounded-full hover:bg-blue-100 transition-colors ${theme === 'dark' ? 'hover:bg-blue-900/30 text-blue-400' : 'text-blue-600'}`}
                  title="Edit Project Name"
                >
                  <FaEdit size={12} />
                </button>
              )}
            </div>
          ) :
            /* Task Name with Edit Functionality */
            item.isTask && item.isCurrent ? (
              <div className="flex items-center gap-1">
                {editingTaskId === (item.task?.TaskID || item.task?._id) ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingTaskName}
                      onChange={(e) => setEditingTaskName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onSaveTaskName(item.task?.TaskID);
                        } else if (e.key === 'Escape') {
                          onCancelEdit();
                        }
                      }}
                      onBlur={() => onCancelEdit()}
                      className={`breadcrumb-edit-input px-2 py-1 text-sm font-medium bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 text-gray-100 border-blue-600' : 'text-gray-900'}`}
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                    {item.task && (
                      <button
                        onClick={() => onEditTaskName(item.task)}
                        className={`breadcrumb-edit-button p-1 rounded-full hover:bg-blue-100 transition-colors ${theme === 'dark' ? 'hover:bg-blue-900/30 text-blue-400' : 'text-blue-600'}`}
                        title="Edit Task Name"
                      >
                        <FaEdit size={12} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ) :
              /* Project Name with Edit Functionality (Current) - Only editable when not on task details page */
              item.isProject && item.isCurrent ? (
                <div className="flex items-center gap-1">
                  {editingProjectId === (item.project?.ProjectID || item.project?._id) ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingProjectName}
                        onChange={(e) => setEditingProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onSaveProjectName(item.project?.ProjectID || item.project?._id);
                          } else if (e.key === 'Escape') {
                            onCancelEdit();
                          }
                        }}
                        onBlur={() => onCancelEdit()}
                        className={`breadcrumb-edit-input px-2 py-1 text-sm font-medium bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 text-gray-100 border-blue-600' : 'text-gray-900'}`}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <span className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                      {/* Only show edit button if not on task details page */}
                      {!router.pathname.startsWith('/task/') && (
                        <button
                          onClick={() => onEditProjectName(item.project)}
                          className={`breadcrumb-edit-button p-1 rounded-full hover:bg-blue-100 transition-colors ${theme === 'dark' ? 'hover:bg-blue-900/30 text-blue-400' : 'text-blue-600'}`}
                          title="Edit Project Name"
                        >
                          <FaEdit size={12} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) :
                /* Regular Items */
                item.isCurrent ? (
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={`hover:text-blue-600 transition-colors duration-200 ${theme === 'dark' ? 'hover:text-blue-400' : ''}`}
                  >
                    {item.label}
                  </Link>
                )}
        </div>
      ))}
    </nav>
  );
};

export default DynamicBreadcrumb;
