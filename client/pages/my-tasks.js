import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaTasks, FaCalendarAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaSearch, FaSpinner, FaFlag, FaEdit, FaTrash, FaTimes, FaShieldAlt, FaRocket, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import { getPriorityBadge } from '../components/task/TaskTypeBadge';
import CustomDropdown from '../components/shared/CustomDropdown';
import MyTasksSkeleton from '../components/skeletons/MyTasksSkeleton';

const MyTasksPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const {
    getTaskTypeBadgeComponent,
    userDetails,
    getProjectStatusBadgeComponent,
    projectStatuses,
    getTableHeaderClasses,
    getTableHeaderTextClasses,
    getTableRowClasses,
    getTableTextClasses,
    getTableSecondaryTextClasses,
    getThemeClasses,
    isMe
  } = useGlobal();
  const { showToast } = useToast();


  // Table styling classes from GlobalContext for consistency
  const tableHeaderTextClasses = getTableHeaderTextClasses();
  const tableRowClasses = getTableRowClasses();
  const tableTextClasses = getTableTextClasses();
  const tableSecondaryTextClasses = getTableSecondaryTextClasses();


  // State management
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');

  // Stats
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    dueTodayTasks: 0,
    highPriorityTasks: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchTerm, statusFilter, priorityFilter, projectFilter, sortBy, sortOrder]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch all user data in a single API call
      const response = await authService.getMyTasksData();

      if (response.success) {
        const { tasks, projects, stats } = response.data;
        setTasks(tasks);
        setProjects(projects);
        setStats(stats);
      } else {
        throw new Error(response.error || 'Failed to fetch user data');
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      showToast('Failed to load your tasks and projects', 'error');
    } finally {
      setLoading(false);
    }
  };


  const applyFilters = () => {
    let filtered = [...tasks];
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.ProjectName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.Status == statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.Priority === priorityFilter);
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.ProjectID === projectFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'deadline':
          aValue = a.Deadline ? new Date(a.Deadline) : new Date('9999-12-31');
          bValue = b.Deadline ? new Date(b.Deadline) : new Date('9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.Priority] || 0;
          bValue = priorityOrder[b.Priority] || 0;
          break;
        case 'status':
          aValue = parseInt(a.Status) || 0;
          bValue = parseInt(b.Status) || 0;
          break;
        case 'name':
          aValue = a.Name.toLowerCase();
          bValue = b.Name.toLowerCase();
          break;
        case 'assignedTo':
          aValue = a.AssignedToDetails?.fullName?.toLowerCase() || '';
          bValue = b.AssignedToDetails?.fullName?.toLowerCase() || '';
          break;
        case 'assignee':
          aValue = a.AssigneeDetails?.fullName?.toLowerCase() || '';
          bValue = b.AssigneeDetails?.fullName?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTasks(filtered);
  };

  // Helper functions for task selection
  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      }
      return [...prev, taskId];
    });
  };

  const handleSelectAllTasks = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task.TaskID || task._id));
    }
  };

  const handleTaskClick = (taskId, projectId) => {
    router.push(`/project/${projectId}?taskId=${taskId}`);
  };

  // Sort handler for table headers
  const handleHeaderSort = (field) => {
    if (sortBy === field) {
      // If already sorting by this field, toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If new field, set to ascending by default
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get sort icon for header
  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <FaSort className="w-3 h-3 opacity-50" />;
    }
    return sortOrder === 'asc' ? <FaSortUp className="w-3 h-3" /> : <FaSortDown className="w-3 h-3" />;
  };

  if (loading) {
    return <MyTasksSkeleton />;
  }

  return (
    <div className={getThemeClasses('bg-white', 'bg-[#18181b]')}>
      <Head>
        <title>My Tasks - TeamLabs</title>
        <meta name="description" content="View and manage all your assigned tasks, projects, and teams" />
      </Head>

      <div>
        {/* Filters and Search */}
        <div className='bg-transparent mb-2'>
          <div className="flex flex-col lg:flex-row gap-4 w-full justify-between">
            {/* Search */}
            <div className="flex-1 lg:w-1/2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={getThemeClasses(
                    'w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    'w-full pl-10 pr-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  )}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-1/2 lg:justify-end">
              {/* Status and Priority - Side by side on mobile, inline on desktop */}
              <div className="flex flex-row gap-4">
                <CustomDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="All Status"
                  options={[
                    { value: 'all', label: 'All Status' },
                    ...projectStatuses.map(status => ({
                      value: status.Code,
                      label: status.Value
                    }))
                  ]}
                  width="w-full lg:w-48"
                  size="md"
                  variant="default"
                />

                <CustomDropdown
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  placeholder="All Priority"
                  options={[
                    { value: 'all', label: 'All Priority' },
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' }
                  ]}
                  width="w-full lg:w-auto"
                  size="md"
                  variant="default"
                />
              </div>

              {/* Projects - Full width below on mobile, inline on desktop */}
              <CustomDropdown
                value={projectFilter}
                onChange={setProjectFilter}
                placeholder="All Projects"
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(project => ({
                    value: project.ProjectID,
                    label: project.Name
                  }))
                ]}
                width="lg:w-64 sm:w-full"
                size="md"
                variant="default"
              />

            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="w-full lg:w-1/2 mb-2">
          <div className="grid grid-cols-5 gap-2">
            <div className={getThemeClasses(
              'bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300',
              'bg-transparent border border-gray-700 hover:bg-gray-800/30 rounded-xl p-4 hover:shadow-lg transition-all duration-300'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getThemeClasses(
                    'text-sm font-medium text-gray-600 text-nowrap',
                    'text-sm font-medium text-gray-400 text-nowrap'
                  )}>Total Tasks</p>
                  <p className={getThemeClasses(
                    'text-2xl font-bold text-gray-900',
                    'text-2xl font-bold text-white'
                  )}>{stats.totalTasks}</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <FaTasks className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className={getThemeClasses(
              'bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300',
              'bg-transparent border border-gray-700 hover:bg-gray-800/30 rounded-xl p-4 hover:shadow-lg transition-all duration-300'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getThemeClasses(
                    'text-sm font-medium text-gray-600 text-nowrap',
                    'text-sm font-medium text-gray-400 text-nowrap'
                  )}>Completed</p>
                  <p className={getThemeClasses(
                    'text-2xl font-bold text-green-600',
                    'text-2xl font-bold text-green-400'
                  )}>{stats.completedTasks}</p>
                </div>
                <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <FaCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className={getThemeClasses(
              'bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300',
              'bg-transparent border border-gray-700 hover:bg-gray-800/30 rounded-xl p-4 hover:shadow-lg transition-all duration-300'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getThemeClasses(
                    'text-sm font-medium text-gray-600 text-nowrap',
                    'text-sm font-medium text-gray-400 text-nowrap'
                  )}>Overdue</p>
                  <p className={getThemeClasses(
                    'text-2xl font-bold text-red-600',
                    'text-2xl font-bold text-red-400'
                  )}>{stats.overdueTasks}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20">
                  <FaExclamationTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className={getThemeClasses(
              'bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300',
              'bg-transparent border border-gray-700 hover:bg-gray-800/30 rounded-xl p-4 hover:shadow-lg transition-all duration-300'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getThemeClasses(
                    'text-sm font-medium text-gray-600 text-nowrap',
                    'text-sm font-medium text-gray-400 text-nowrap'
                  )}>Due Today</p>
                  <p className={getThemeClasses(
                    'text-2xl font-bold text-yellow-600',
                    'text-2xl font-bold text-yellow-400'
                  )}>{stats.dueTodayTasks}</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/20">
                  <FaCalendarAlt className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className={getThemeClasses(
              'bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300',
              'bg-transparent border border-gray-700 hover:bg-gray-800/30 rounded-xl p-4 hover:shadow-lg transition-all duration-300'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getThemeClasses(
                    'text-sm font-medium text-gray-600 text-nowrap',
                    'text-sm font-medium text-gray-400 text-nowrap'
                  )}>High Priority</p>
                  <p className={getThemeClasses(
                    'text-2xl font-bold text-red-600',
                    'text-2xl font-bold text-red-400'
                  )}>{stats.highPriorityTasks}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20">
                  <FaFlag className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className={getThemeClasses('bg-white border border-gray-200 rounded-xl flex-1', 'bg-transparent border border-gray-700 rounded-xl flex-1')}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className={getThemeClasses(
                'text-xl font-bold text-gray-900',
                'text-xl font-bold text-white'
              )}>
                Your Tasks ({filteredTasks.length})
              </h2>
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
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredTasks.length === 0 ? (
              <div className={getThemeClasses(
                'text-center py-8 text-gray-400',
                'dark:text-gray-500'
              )}>
                <FaTasks className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
                    ? 'No tasks match your filters'
                    : 'No tasks assigned to you'
                  }
                </h3>
                <p className={tableSecondaryTextClasses}>
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'Check with your team lead to get assigned to tasks'
                  }
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className={getTableHeaderClasses()}>
                    <th className="py-3 px-4 text-center w-[50px]">
                      <input
                        type="checkbox"
                        checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                        onChange={handleSelectAllTasks}
                        className={getThemeClasses(
                          'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                          'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                        )}
                      />
                    </th>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('name')}
                        className={`flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
                      >
                        Name
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignedTo')}
                        className={`flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
                      >
                        Assigned To
                        {getSortIcon('assignedTo')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignee')}
                        className={`flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
                      >
                        Assignee
                        {getSortIcon('assignee')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-center ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('deadline')}
                        className={`flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mx-auto ${tableHeaderTextClasses}`}
                      >
                        Date Assigned
                        {getSortIcon('deadline')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('priority')}
                        className={`flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
                      >
                        Priority
                        {getSortIcon('priority')}
                      </button>
                    </th>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('status')}
                        className={`flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.TaskID || task._id} className={tableRowClasses}>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.TaskID || task._id)}
                          onChange={() => handleSelectTask(task.TaskID || task._id)}
                          className={getThemeClasses(
                            'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                            'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                          )}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => handleTaskClick(task.TaskID || task._id, task.ProjectID)}
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
                      <td className="py-3 px-4 text-left">
                        {getProjectStatusBadgeComponent(task.Status, true)}
                      </td>
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleTaskClick(task.TaskID || task._id, task.ProjectID)}
                            className={getThemeClasses(
                              'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                              'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                            )}
                            title="Edit Task"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleTaskClick(task.TaskID || task._id, task.ProjectID)}
                            className={getThemeClasses(
                              'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                              'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                            )}
                            title="Delete Task"
                          >
                            <FaTrash size={14} />
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
    </div>
  );
};

export default MyTasksPage;
