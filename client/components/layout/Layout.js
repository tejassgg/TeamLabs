import Navbar from './Navbar.js';
import Sidebar from './Sidebar.js';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { projectService, taskService } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';
import { useToast } from '../../context/ToastContext';
import Link from 'next/link';

import DynamicBreadcrumb from '../shared/DynamicBreadcrumb';
import ReleaseNotificationBanner from '../shared/ReleaseNotificationBanner';
import useReleaseNotifications from '../../hooks/useReleaseNotifications';
import SearchModal from '../shared/SearchModal';
import AddTaskModal from '../shared/AddTaskModal';

const isProfileComplete = (userDetails) => {
  if (!userDetails) {
    return false;
  }
  // Adjust these fields as per your required profile fields
  const requiredFields = [
    'firstName', 'lastName', 'email'
  ];
  const result = requiredFields.every(field => {
    const hasField = userDetails[field] && userDetails[field].toString().trim() !== '';
    if (!hasField) {
      console.log(`isProfileComplete: Missing or empty field: ${field}`, userDetails[field]);
    }
    return hasField;
  });
  return result;
};

const Layout = ({ children, pageProject, pageTitle }) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useGlobal();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const {
    teams,
    projects,
    tasksDetails,
    userDetails,
    loading,
    setProjects,
    setTasksDetails,
    addTaskModalConfig,
    closeAddTaskModal
  } = useGlobal();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Global Add/Update Task Handlers for Global AddTaskModal
  const handleGlobalAddTask = async (taskData) => {
    if (addTaskModalConfig.onAddTask) {
      return await addTaskModalConfig.onAddTask(taskData);
    }
    try {
      const newTask = await taskService.addTaskDetails(taskData, addTaskModalConfig.mode);
      const typeLabel = newTask.Type === 'User Story' ? 'User Story' : 'Task';
      showToast(`${typeLabel} added successfully!`, 'success', 5000, {
        description: `${typeLabel} "${newTask?.Name || taskData?.Name || ''}" has been created.`,
        action: {
          label: 'View',
          onClick: () => router.push(`/task/${newTask.TaskID}`)
        }
      });
      if (addTaskModalConfig.onSuccess) {
        await addTaskModalConfig.onSuccess(newTask);
      }
      return newTask;
    } catch (err) {
      console.error('Failed to create task globally:', err);
      if (err?.response?.status === 403) {
        throw err;
      }
      showToast(err.message || 'Failed to create task', 'error');
      throw err;
    }
  };

  const handleGlobalUpdateTask = async (taskId, taskData) => {
    if (addTaskModalConfig.onUpdateTask) {
      return await addTaskModalConfig.onUpdateTask(taskId, taskData);
    }
    try {
      const updatedTask = await taskService.updateTask(taskId, taskData);
      showToast('Task updated successfully!', 'success');
      if (addTaskModalConfig.onSuccess) {
        await addTaskModalConfig.onSuccess(updatedTask);
      }
      return updatedTask;
    } catch (err) {
      console.error('Failed to update task globally:', err);
      showToast(err.message || 'Failed to update task', 'error');
      throw err;
    }
  };

  // Keyboard listener for search modal (Ctrl + / or Cmd + /)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Release notifications hook
  const { latestRelease, hasNewRelease, versionUpdateAvailable, dismissRelease, markAsSeen } = useReleaseNotifications();

  // Apply user's font preference on mount
  useEffect(() => {
    const fontOptions = [
      { value: 'Inter', fontFamily: 'Inter, sans-serif' },
      { value: 'Roboto', fontFamily: 'Roboto, sans-serif' },
      { value: 'Open Sans', fontFamily: 'Open Sans, sans-serif' },
      { value: 'Lato', fontFamily: 'Lato, sans-serif' },
      { value: 'Montserrat', fontFamily: 'Montserrat, sans-serif' },
      { value: 'Poppins', fontFamily: 'Poppins, sans-serif' },
      { value: 'Source Sans Pro', fontFamily: 'Source Sans Pro, sans-serif' },
      { value: 'Nunito', fontFamily: 'Nunito, sans-serif' },
      { value: 'JetBrains Mono', fontFamily: 'JetBrains Mono, monospace' }
    ];
    const userFont = userDetails?.fontFamily || 'JetBrains Mono';
    const selectedFont = fontOptions.find(f => f.value === userFont);
    if (selectedFont) {
      document.documentElement.style.setProperty('--font-family', selectedFont.fontFamily);
    }
  }, [userDetails?.fontFamily]);

  // Inline editing states
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingTaskName, setEditingTaskName] = useState('');

  // Get page title from router or props
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;

    const path = router.pathname;
    const query = router.query;

    // Map routes to titles
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/kanban') return 'Kanban Board';
    if (path === '/projects') return 'Projects';
    if (path === '/tasks') return 'Tasks';
    if (path === '/timesheet') return 'Timesheet';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    if (path === '/messages') return 'Messages';
    if (path === '/payment') return 'Payment';
    if (path === '/teams') return 'Teams';
    if (path === '/projects') return 'Projects';
    if (path === '/playground') return 'Playground';

    if (path === '/task/[taskId]') {
      const taskId = query.taskId;
      const task = tasksDetails.find(t => t.TaskID === taskId || t._id === taskId);
      if (task) {
        return (task.TicketNumber || task.TaskNumber) ? `${task.TicketNumber || task.TaskNumber} - ${task.Name}` : task.Name;
      }
      return 'Task Details';
    }

    if (path === '/project/[projectId]') {
      const projectId = query.projectId;
      const project = projects.find(p => p.ProjectID === projectId || p._id === projectId);
      return project?.Name || 'Project Details';
    }

    if (path === '/team/[teamId]') {
      const teamId = query.teamId;
      const team = teams.find(t => t.TeamID === teamId || t._id === teamId);
      return team?.TeamName || 'Team Details';
    }

    return null;
  };

  // Get project data for breadcrumb
  const getPageProject = () => {
    if (pageProject) return pageProject;

    const path = router.pathname;
    const query = router.query;

    if (path === '/task/[taskId]') {
      const taskId = query.taskId;
      const task = tasksDetails.find(t => t.TaskID === taskId || t._id === taskId);
      if (task?.ProjectID_FK) {
        return projects.find(p => p.ProjectID === task.ProjectID_FK || p._id === task.ProjectID_FK);
      }
    }

    return null;
  };

  const currentPageTitle = getPageTitle();
  const currentPageProject = getPageProject();
  const hideTitleOnMobile = isMobile && (router.pathname === '/project/[projectId]' || router.pathname === '/task/[taskId]');
  const hideBreadcrumbOnMobile = isMobile && router.pathname === '/task/[taskId]';

  // Inline editing functions
  const handleEditProjectName = (project) => {
    setEditingProjectId(project.ProjectID || project._id);
    setEditingProjectName(project.Name || '');
  };

  const handleSaveProjectName = async (projectId) => {
    try {
      const project = projects.find(p => p.ProjectID === projectId || p._id === projectId);
      if (!project || editingProjectName.trim() === project.Name) {
        setEditingProjectId(null);
        setEditingProjectName('');
        return;
      }

      // Call API to update project name in database
      await projectService.updateProject(projectId, {
        Name: editingProjectName.trim()
      });

      // Update project name in the global context
      setProjects(prevProjects =>
        prevProjects.map(p =>
          (p.ProjectID === projectId || p._id === projectId)
            ? { ...p, Name: editingProjectName.trim() }
            : p
        )
      );

      // Update project name in localStorage if needed
      if (typeof window !== 'undefined') {
        const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        const updatedStoredProjects = storedProjects.map(p =>
          (p.ProjectID === projectId || p._id === projectId)
            ? { ...p, Name: editingProjectName.trim() }
            : p
        );
        localStorage.setItem('projects', JSON.stringify(updatedStoredProjects));
      }

      showToast('Project name updated successfully!', 'success');
      setEditingProjectId(null);
      setEditingProjectName('');
    } catch (error) {
      console.error('Error updating project name:', error);
      showToast('Failed to update project name', 'error');
    }
  };

  const handleEditTaskName = (task) => {
    if (!task) {
      console.warn('Task object is undefined in handleEditTaskName');
      return;
    }
    setEditingTaskId(task.TaskID || task._id);
    setEditingTaskName(task.Name || '');
  };

  const handleSaveTaskName = async (taskId) => {
    try {

      const task = tasksDetails.find(t => t.TaskID === taskId);
      if (!task || editingTaskName.trim() === task.Name) {
        setEditingTaskId(null);
        setEditingTaskName('');
        return;
      }

      // Call API to update task name in database
      await taskService.updateTask(taskId, {
        Name: editingTaskName.trim()
      });

      // Update task name in the global context
      setTasksDetails(prevTasks =>
        prevTasks.map(t =>
          (t.TaskID === taskId || t._id === taskId)
            ? { ...t, Name: editingTaskName.trim() }
            : t
        )
      );

      // Update task name in localStorage if needed
      if (typeof window !== 'undefined') {
        const storedTasks = JSON.parse(localStorage.getItem('tasksDetails') || '[]');
        const updatedStoredTasks = storedTasks.map(t =>
          (t.TaskID === taskId || t._id === taskId)
            ? { ...t, Name: editingTaskName.trim() }
            : t
        );
        localStorage.setItem('tasksDetails', JSON.stringify(updatedStoredTasks));
      }

      showToast('Task name updated successfully!', 'success');
      setEditingTaskId(null);
      setEditingTaskName('');
    } catch (error) {
      console.error('Error updating task name:', error);
      showToast('Failed to update task name', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditingTaskId(null);
    setEditingProjectName('');
    setEditingTaskName('');
  };



  // Load collapsed state from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        const collapsedState = JSON.parse(saved);
        setSidebarCollapsed(collapsedState);
      }
    }
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Reset redirecting state when route changes
  useEffect(() => {
    setIsRedirecting(false);
  }, [router.pathname]);

  // Handle click outside to cancel editing
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingProjectId || editingTaskId) {
        const target = event.target;
        if (!target.closest('.breadcrumb-edit-input') && !target.closest('.breadcrumb-edit-button')) {
          handleCancelEdit();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingProjectId, editingTaskId]);

  // Check if first time setup is needed
  useEffect(() => {
    // Never redirect away from /dashboard, /profile, /logout or /welcome for onboarding
    if (
      userDetails &&
      !userDetails.onboardingCompleted &&
      !['/dashboard', '/profile', '/logout'].includes(router.pathname)
    ) {
      router.push('/dashboard');
    }
  }, [userDetails, router.pathname, router]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('mobile-sidebar');
      if (isMobile && isMobileSidebarOpen && sidebar && !sidebar.contains(event.target) &&
        !event.target.closest('.sidebar-toggle')) {
        setIsMobileSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileSidebarOpen]);

  useEffect(() => {
    if (loading || isRedirecting) return; // Prevent redirect loops
    // Only run on client
    if (typeof window === 'undefined') return;
    // Never redirect away from /profile or /welcome for profile completion

    if (!isProfileComplete(userDetails) && !['/profile', '/logout'].includes(router.pathname) && userDetails?.onboardingCompleted && router.pathname !== '/profile') {
      // console.log('Redirecting to profile due to incomplete profile:', {
      //   isProfileComplete: isProfileComplete(userDetails),
      //   currentPath: router.pathname,
      //   onboardingCompleted: userDetails?.onboardingCompleted,
      //   userDetails: userDetails
      // });
      setIsRedirecting(true);
      router.replace('/profile');
    }
  }, [userDetails, loading, router.pathname, isRedirecting]);

  return (
    <div className={`min-h-screen bg-white text-gray-900 dark:bg-dark-bg dark:text-white`}>
      <div id="mobile-sidebar">
        <Sidebar isMobile={isMobile} isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} setSidebarCollapsed={setSidebarCollapsed} />
      </div>
      {/* Mobile Navbar with Hamburger */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 dark:bg-dark-card/95 dark:backdrop-blur-sm dark:border-b dark:border-gray-800 shadow-md`}>
        <div className="px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              className={`sidebar-toggle p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transform hover:scale-110`}
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <FaBars size={22} />
            </button>
            {!hideTitleOnMobile && currentPageTitle ? (
              <div className="text-2xl font-bold text-gray-900 dark:text-white select-none">
                {currentPageTitle}
              </div>
            ) : (
              <Link href="/" className="flex items-center gap-2 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
                TeamLabs
              </Link>
            )}
          </div>
          <div>
            <Navbar
              isMobile={true}
              theme={theme}
              onLogout={logout}
              pageTitle={currentPageTitle}
              onSearchClick={() => setIsSearchModalOpen(true)}
            />
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div
        className={`transition-all duration-500 ease-in-out ${isMobile ? 'ml-0 pt-14' : (sidebarCollapsed ? 'ml-16' : 'ml-64')}`}
        style={{ transition: 'margin-left 500ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {!isMobile && (
          <div className="flex justify-center sticky top-0 z-20 bg-white dark:bg-dark-bg">
            <div style={{ width: '100%' }}>
              <Navbar
                theme={theme}
                onLogout={logout}
                pageTitle={currentPageTitle}
                onSearchClick={() => setIsSearchModalOpen(true)}
              />
            </div>
          </div>
        )}
        <main className={`overflow-y-auto min-h-[calc(100vh-80px)] p-2 dark:bg-dark-bg dark:text-white`}>
          {/* Release Notification Banner */}
          {latestRelease && (
            <div className="py-2" data-release-banner>
              <ReleaseNotificationBanner
                releaseData={latestRelease}
                onClose={() => {
                  dismissRelease(latestRelease._id);
                  markAsSeen(latestRelease._id);
                }}
              />
            </div>
          )}

          {!hideBreadcrumbOnMobile && router.pathname !== '/messages' && (
            <div className="px-2">
              <DynamicBreadcrumb
                teams={teams}
                projects={projects}
                tasksDetails={tasksDetails}
                currentPageProject={currentPageProject}
                onEditProjectName={handleEditProjectName}
                onEditTaskName={handleEditTaskName}
                onSaveProjectName={handleSaveProjectName}
                onSaveTaskName={handleSaveTaskName}
                onCancelEdit={handleCancelEdit}
                editingProjectId={editingProjectId}
                editingTaskId={editingTaskId}
                editingProjectName={editingProjectName}
                editingTaskName={editingTaskName}
                setEditingProjectName={setEditingProjectName}
                setEditingTaskName={setEditingTaskName}
              />
            </div>
          )}
          {children}
        </main>
      </div>
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && (
        <div
          className={`fixed inset-0 z-30 transition-all duration-500 ease-in-out ${isMobileSidebarOpen
            ? 'bg-black/50 pointer-events-auto'
            : 'bg-transparent pointer-events-none'
            }`}
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}


      {/* Organization Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <AddTaskModal
        isOpen={addTaskModalConfig.isOpen}
        onClose={closeAddTaskModal}
        onAddTask={handleGlobalAddTask}
        onUpdateTask={handleGlobalUpdateTask}
        mode={addTaskModalConfig.mode}
        projectIdDefault={addTaskModalConfig.projectIdDefault}
        parentIdDefault={addTaskModalConfig.parentIdDefault}
        userStories={addTaskModalConfig.userStories}
        editingTask={addTaskModalConfig.editingTask}
        addTaskTypeMode={addTaskModalConfig.addTaskTypeMode}
        projectMembers={addTaskModalConfig.projectMembers}
      />
    </div>
  );
};

export default Layout;