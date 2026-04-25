import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaTasks, FaCalendarAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaSearch, FaSpinner, FaFlag, FaEdit, FaTrash, FaTimes, FaShieldAlt, FaRocket, FaSort, FaSortUp, FaSortDown, FaFilter } from 'react-icons/fa';

import { useTheme } from '../context/ThemeContext';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import { getPriorityBadge } from '../components/task/TaskTypeBadge';
import CustomDropdown from '../components/shared/CustomDropdown';
import MyTasksSkeleton from '../components/skeletons/MyTasksSkeleton';

const MyTasksPage = () => {
  const router = useRouter();
  const { userDetails } = useGlobal();
  const { theme } = useTheme();
  const {
    getTaskTypeBadgeComponent,
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
  const [statusFilter, setStatusFilter] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState([]);
  const [projectFilter, setProjectFilter] = useState([]);
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const filterDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stats
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    dueTodayTasks: 0,
    highPriorityTasks: 0
  });

  useEffect(() => {
    if (userDetails) {
      fetchUserData();
    }
  }, [userDetails]);

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
    if (statusFilter.length > 0) {
      filtered = filtered.filter(task => statusFilter.includes(task.Status));
    }

    // Priority filter
    if (priorityFilter.length > 0) {
      filtered = filtered.filter(task => priorityFilter.includes(task.Priority));
    }

    // Project filter
    if (projectFilter.length > 0) {
      filtered = filtered.filter(task => projectFilter.includes(task.ProjectID));
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
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-1/2 lg:justify-end relative" ref={filterDropdownRef}>
              <button
                onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
                className={getThemeClasses(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors',
                  'flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 text-white transition-colors'
                )}
              >
                <FaFilter className="w-4 h-4" />
                <span>Filters</span>
                {(statusFilter.length > 0 || priorityFilter.length > 0 || projectFilter.length > 0) && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {statusFilter.length + priorityFilter.length + projectFilter.length}
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              {isFilterModalOpen && (
                <div className={getThemeClasses(
                  'absolute right-0 top-full mt-2 z-50 w-[300px] sm:w-[500px] lg:w-[700px] bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col',
                  'absolute right-0 top-full mt-2 z-50 w-[300px] sm:w-[500px] lg:w-[700px] bg-[#232323] border border-gray-600 rounded-xl shadow-lg flex flex-col'
                )}>
                  <div className={getThemeClasses(
                    'p-4 border-b border-gray-200 flex items-center justify-between',
                    'p-4 border-b border-gray-600 flex items-center justify-between'
                  )}>
                    <h3 className={getThemeClasses('text-base font-bold text-gray-900', 'text-base font-bold text-white')}>
                      Filter Tasks
                    </h3>
                    <button
                      onClick={() => setIsFilterModalOpen(false)}
                      className={getThemeClasses('text-gray-400 hover:text-gray-600', 'text-gray-500 hover:text-gray-300')}
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>

                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Status Column */}
                      <div>
                        <h4 className={getThemeClasses('text-sm font-semibold mb-3 text-gray-900', 'text-sm font-semibold mb-3 text-white')}>Status</h4>
                        <div className="space-y-2">
                          {projectStatuses.map(status => (
                            <label key={status.Code} className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={statusFilter.includes(status.Code)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setStatusFilter([...statusFilter, status.Code]);
                                  } else {
                                    setStatusFilter(statusFilter.filter(s => s !== status.Code));
                                  }
                                }}
                                className={getThemeClasses(
                                  'mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                  'mt-0.5 w-4 h-4 rounded border-gray-600 bg-[#2A2A2A] checked:bg-blue-600'
                                )}
                              />
                              <span className={getThemeClasses('text-sm text-gray-700', 'text-sm text-gray-300')}>{status.Value}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Priority Column */}
                      <div>
                        <h4 className={getThemeClasses('text-sm font-semibold mb-3 text-gray-900', 'text-sm font-semibold mb-3 text-white')}>Priority</h4>
                        <div className="space-y-2">
                          {['High', 'Medium', 'Low'].map(priority => (
                            <label key={priority} className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={priorityFilter.includes(priority)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPriorityFilter([...priorityFilter, priority]);
                                  } else {
                                    setPriorityFilter(priorityFilter.filter(p => p !== priority));
                                  }
                                }}
                                className={getThemeClasses(
                                  'mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                  'mt-0.5 w-4 h-4 rounded border-gray-600 bg-[#2A2A2A] checked:bg-blue-600'
                                )}
                              />
                              <span className={getThemeClasses('text-sm text-gray-700', 'text-sm text-gray-300')}>{priority}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Projects Column */}
                      <div>
                        <h4 className={getThemeClasses('text-sm font-semibold mb-3 text-gray-900', 'text-sm font-semibold mb-3 text-white')}>Projects</h4>
                        <div className="space-y-2">
                          {projects.map(project => (
                            <label key={project.ProjectID} className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectFilter.includes(project.ProjectID)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setProjectFilter([...projectFilter, project.ProjectID]);
                                  } else {
                                    setProjectFilter(projectFilter.filter(p => p !== project.ProjectID));
                                  }
                                }}
                                className={getThemeClasses(
                                  'mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                  'mt-0.5 w-4 h-4 rounded border-gray-600 bg-[#2A2A2A] checked:bg-blue-600'
                                )}
                              />
                              <span className={getThemeClasses('text-sm text-gray-700', 'text-sm text-gray-300')}>{project.Name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={getThemeClasses(
                    'p-4 border-t border-gray-200 flex justify-between gap-3',
                    'p-4 border-t border-gray-600 flex justify-between gap-3'
                  )}>
                    <button
                      onClick={() => {
                        setStatusFilter([]);
                        setPriorityFilter([]);
                        setProjectFilter([]);
                      }}
                      className={getThemeClasses(
                        'px-4 py-2 text-sm rounded-lg text-gray-700 hover:text-red-600 transition-colors',
                        'px-4 py-2 text-sm rounded-lg text-gray-300 hover:text-red-400 transition-colors'
                      )}
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => setIsFilterModalOpen(false)}
                      className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
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
                <div className="p-2 rounded-xl bg-blue-100 bg-blue-900/20">
                  <FaTasks className="w-4 h-4 text-blue-600 text-blue-400" />
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
                <div className="p-2 rounded-xl bg-green-100 bg-green-900/20">
                  <FaCheckCircle className="w-4 h-4 text-green-600 text-green-400" />
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
                <div className="p-2 rounded-xl bg-red-100 bg-red-900/20">
                  <FaExclamationTriangle className="w-4 h-4 text-red-600 text-red-400" />
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
                <div className="p-2 rounded-xl bg-yellow-100 bg-yellow-900/20">
                  <FaCalendarAlt className="w-4 h-4 text-yellow-600 text-yellow-400" />
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
                <div className="p-2 rounded-xl bg-red-100 bg-red-900/20">
                  <FaFlag className="w-4 h-4 text-red-600 text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className={getThemeClasses('bg-white flex-1', 'bg-transparent flex-1')}>
          <div className=" py-4 flex items-center justify-between">
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
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-900/30 text-blue-300'
                  )}>
                    <span className="text-sm font-medium">{selectedTasks.length} selected</span>
                    <button
                      onClick={() => setSelectedTasks([])}
                      className={getThemeClasses(
                        'p-1 hover:bg-blue-100 rounded-full transition-colors',
                        'p-1 hover:bg-blue-900/50 rounded-full transition-colors'
                      )}
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-300 rounded-xl">
            {filteredTasks.length === 0 ? (
              <div className={getThemeClasses(
                'text-center py-8 text-gray-400',
                'text-center py-8  text-gray-500'
              )}>
                <FaTasks className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || statusFilter.length > 0 || priorityFilter.length > 0 || projectFilter.length > 0
                    ? 'No tasks match your filters'
                    : 'No tasks assigned to you'
                  }
                </h3>
                <p className={tableSecondaryTextClasses}>
                  {searchTerm || statusFilter.length > 0 || priorityFilter.length > 0 || projectFilter.length > 0
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
                          'w-4 h-4 rounded border-gray-600 bg-gray-700 checked:bg-blue-600'
                        )}
                      />
                    </th>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('name')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
                      >
                        Name
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignedTo')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
                      >
                        Assigned To
                        {getSortIcon('assignedTo')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignee')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
                      >
                        Assignee
                        {getSortIcon('assignee')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-center ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('deadline')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors mx-auto ${tableHeaderTextClasses}`}
                      >
                        Date Assigned
                        {getSortIcon('deadline')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('priority')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
                      >
                        Priority
                        {getSortIcon('priority')}
                      </button>
                    </th>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('status')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors ${tableHeaderTextClasses}`}
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
                            'w-4 h-4 rounded border-gray-600 bg-gray-700 checked:bg-blue-600'
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
                                'text-left hover:text-blue-400 hover:underline transition-colors cursor-pointer font-medium'
                              )}
                              title="Click to view task details"
                            >
                              {task.Name}
                            </button>
                            {getTaskTypeBadgeComponent(task.Type)}
                          </div>
                          <span className={getThemeClasses(
                            'text-xs text-gray-500',
                            'text-xs text-gray-400'
                          )}>{task.Description}</span>
                          {/* Show assigned to on mobile if available */}
                          {task.AssignedTo && task.AssignedToDetails && (
                            <div className={getThemeClasses(
                              'md:hidden mt-1 flex items-center gap-1 text-xs text-gray-600',
                              'md:hidden mt-1 flex items-center gap-1 text-xs text-gray-300'
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
                              'w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-black font-medium text-sm'
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
                              'w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center text-black font-medium text-sm'
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
                              'bg-gray-700 text-gray-400'
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
                              'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
                            )}
                            title="Edit Task"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleTaskClick(task.TaskID || task._id, task.ProjectID)}
                            className={getThemeClasses(
                              'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                              'text-red-400 bg-red-900/50 hover:bg-red-800/50'
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
