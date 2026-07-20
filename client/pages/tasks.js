import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaTasks, FaCalendarAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaSearch, FaSpinner, FaFlag, FaEdit, FaTrash, FaTimes, FaShieldAlt, FaRocket, FaSort, FaSortUp, FaSortDown, FaFilter, FaChevronLeft, FaChevronRight, FaChartBar } from 'react-icons/fa';
import useSWR from 'swr';

import { useTheme } from '../context/ThemeContext';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import { getPriorityBadge } from '../components/task/TaskTypeBadge';
import CustomDropdown from '../components/shared/CustomDropdown';
import TasksSkeleton from '../components/skeletons/TasksSkeleton';

const TasksPage = () => {
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
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('assignedDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

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

  // SWR-based query for personal tasks and stats
  const { data: myTasksRes, error: fetchError } = useSWR(
    userDetails?._id ? '/auth/tasks-data' : null,
    () => authService.getTasksData(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const loading = !myTasksRes && !fetchError;

  // Synchronize query response with page state hooks
  useEffect(() => {
    if (myTasksRes && myTasksRes.success) {
      const { tasks, projects, stats } = myTasksRes.data;
      setTasks(tasks);
      setProjects(projects);
      setStats(stats);
    }
  }, [myTasksRes]);

  // Sync request errors
  useEffect(() => {
    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      showToast('Failed to load your tasks and projects', 'error');
    }
  }, [fetchError]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [tasks, searchTerm, statusFilter, priorityFilter, projectFilter, sortBy, sortOrder]);


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
    if (statusFilter) {
      filtered = filtered.filter(task => task.Status === statusFilter);
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(task => task.Priority === priorityFilter);
    }

    // Project filter
    if (projectFilter) {
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
        case 'assignedDate':
          aValue = a.AssignedDate ? new Date(a.AssignedDate) : new Date('1970-01-01');
          bValue = b.AssignedDate ? new Date(b.AssignedDate) : new Date('1970-01-01');
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

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  if (loading) {
    return <TasksSkeleton />;
  }

  return (
    <div className={getThemeClasses('bg-white', 'bg-dark-bg')}>
      <Head>
        <title>My Tasks - TeamLabs</title>
        <meta name="description" content="View and manage all your assigned tasks, projects, and teams" />
      </Head>

      <div>
        {/* Filters and Search */}
        <div className='bg-transparent mb-2'>
          <div className="flex flex-col lg:flex-row gap-4 w-full justify-between mt-3">
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
            <div className="flex flex-row gap-2 w-full lg:w-auto lg:justify-end relative" ref={filterDropdownRef}>
              {/* Show Stats button for mobile only */}
              <button
                onClick={() => setIsStatsModalOpen(true)}
                className={getThemeClasses(
                  'md:hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors flex-1',
                  'md:hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 text-white transition-colors flex-1'
                )}
              >
                <FaChartBar className="w-4 h-4 text-blue-500" />
                <span>Stats</span>
              </button>

              <button
                onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
                className={getThemeClasses(
                  'flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors flex-1 lg:flex-none',
                  'flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 text-white transition-colors flex-1 lg:flex-none'
                )}
              >
                <FaFilter className="w-4 h-4" />
                <span>Filters</span>
                {((statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0) + (projectFilter ? 1 : 0)) > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {(statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0) + (projectFilter ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              {isFilterModalOpen && (
                <div className={getThemeClasses(
                  'absolute right-0 top-full mt-2 z-50 w-[300px] sm:w-[500px] lg:w-[700px] bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col',
                  'absolute right-0 top-full mt-2 z-50 w-[300px] sm:w-[500px] lg:w-[700px] bg-dark-card border border-gray-600 rounded-xl shadow-lg flex flex-col'
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

                  <div className="p-4 overflow-visible relative z-20">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Status Column */}
                      <div>
                        <h4 className={getThemeClasses('text-sm font-semibold mb-2 text-gray-900', 'text-sm font-semibold mb-2 text-white')}>Status</h4>
                        <CustomDropdown
                          value={statusFilter}
                          onChange={(val) => setStatusFilter(val)}
                          options={[
                            { value: '', label: 'All Statuses' },
                            ...projectStatuses.map(status => ({ value: status.Code, label: status.Value }))
                          ]}
                          placeholder="All Statuses"
                          size="sm"
                        />
                      </div>

                      {/* Priority Column */}
                      <div>
                        <h4 className={getThemeClasses('text-sm font-semibold mb-2 text-gray-900', 'text-sm font-semibold mb-2 text-white')}>Priority</h4>
                        <CustomDropdown
                          value={priorityFilter}
                          onChange={(val) => setPriorityFilter(val)}
                          options={[
                            { value: '', label: 'All Priorities' },
                            { value: 'High', label: 'High' },
                            { value: 'Medium', label: 'Medium' },
                            { value: 'Low', label: 'Low' }
                          ]}
                          placeholder="All Priorities"
                          size="sm"
                        />
                      </div>

                      {/* Projects Column */}
                      <div>
                        <h4 className={getThemeClasses('text-sm font-semibold mb-2 text-gray-900', 'text-sm font-semibold mb-2 text-white')}>Projects</h4>
                        <CustomDropdown
                          value={projectFilter}
                          onChange={(val) => setProjectFilter(val)}
                          options={[
                            { value: '', label: 'All Projects' },
                            ...projects.map(project => ({ value: project.ProjectID, label: project.Name }))
                          ]}
                          placeholder="All Projects"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={getThemeClasses(
                    'p-4 border-t border-gray-200 flex justify-between gap-3 relative z-10',
                    'p-4 border-t border-gray-600 flex justify-between gap-3 relative z-10'
                  )}>
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setPriorityFilter('');
                        setProjectFilter('');
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

        {/* Stats Cards - Hidden on Mobile, shown on Desktop */}
        <div className="hidden md:block w-full lg:w-1/2 mb-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className={getThemeClasses(
              'bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300',
              'bg-transparent border border-gray-700 hover:bg-gray-800/30 rounded-xl p-4 hover:shadow-lg transition-all duration-300'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getThemeClasses(
                    'text-sm font-medium text-gray-600',
                    'text-sm font-medium text-gray-400'
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
                    'text-sm font-medium text-gray-600',
                    'text-sm font-medium text-gray-400'
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
                    'text-sm font-medium text-gray-600',
                    'text-sm font-medium text-gray-400'
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
                    'text-sm font-medium text-gray-600',
                    'text-sm font-medium text-gray-400'
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
              'bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 col-span-2 sm:col-span-1',
              'bg-transparent border border-gray-700 hover:bg-gray-800/30 rounded-xl p-4 hover:shadow-lg transition-all duration-300 col-span-2 sm:col-span-1'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getThemeClasses(
                    'text-sm font-medium text-gray-600',
                    'text-sm font-medium text-gray-400'
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
          <div className=" py-1 flex items-center justify-between">
            <h2 className={getThemeClasses(
              'text-xl font-bold text-gray-900',
              'text-xl font-bold text-white'
            )}>
              Your Tasks ({filteredTasks.length})
            </h2>
            <div className="flex items-center gap-4">
              {/* Per page selector */}
              {filteredTasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className={getThemeClasses('text-xs font-semibold text-gray-500', 'text-xs font-semibold text-gray-400')}>
                    Per page:
                  </span>
                  <CustomDropdown
                    value={tasksPerPage}
                    onChange={(val) => {
                      setTasksPerPage(Number(val));
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: 5, label: '5' },
                      { value: 10, label: '10' },
                      { value: 25, label: '25' },
                      { value: 50, label: '50' }
                    ]}
                    placeholder="10"
                    variant="filled"
                    size="sm"
                    width="w-20"
                  />
                </div>
              )}

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

          {/* Pagination Controls */}
          {filteredTasks.length > 0 && (
            <div className={getThemeClasses(
              'flex flex-col sm:flex-row items-center justify-between gap-2 p-1 bg-white shadow-sm',
              'flex flex-col sm:flex-row items-center justify-between gap-2 p-1 shadow-sm'
            )}>
              <div className={getThemeClasses('text-sm text-gray-650 text-gray-500', 'text-sm text-gray-400')}>
                Showing <span className="font-semibold text-blue-500">{indexOfFirstTask + 1}</span> to{' '}
                <span className="font-semibold text-blue-500">
                  {Math.min(indexOfLastTask, filteredTasks.length)}
                </span>{' '}
                of <span className="font-semibold">{filteredTasks.length}</span> tasks
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={getThemeClasses(
                    'px-3.5 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 bg-white border-gray-300',
                    'px-3.5 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800/40 text-gray-300 bg-[#2A2A2A] border-gray-600'
                  )}
                >
                  <FaChevronLeft className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNum = index + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? 'px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-blue-600 shadow-sm shadow-blue-500/20'
                              : getThemeClasses(
                                'px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 bg-white',
                                'px-3 py-1.5 rounded-lg border border-gray-600 hover:bg-gray-800/40 text-sm font-medium text-gray-300 bg-[#2A2A2A]'
                              )
                          }
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={pageNum} className="text-gray-400 px-1 text-sm font-bold">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={getThemeClasses(
                    'px-3.5 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 bg-white border-gray-300',
                    'px-3.5 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800/40 text-gray-300 bg-[#2A2A2A] border-gray-600'
                  )}
                >
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div className={getThemeClasses('overflow-x-auto border border-gray-300 rounded-xl', 'overflow-x-auto border border-zinc-800 rounded-xl')}>
            {filteredTasks.length === 0 ? (
              <div className={getThemeClasses(
                'text-center py-8 text-gray-400',
                'text-center py-8  text-gray-500'
              )}>
                <FaTasks className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || statusFilter || priorityFilter || projectFilter
                    ? 'No tasks match your filters'
                    : 'No tasks assigned to you'
                  }
                </h3>
                <p className={tableSecondaryTextClasses}>
                  {searchTerm || statusFilter || priorityFilter || projectFilter
                    ? 'Try adjusting your search criteria'
                    : 'Check with your team lead to get assigned to tasks'
                  }
                </p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className={getTableHeaderClasses('bg-gray-50 border-b border-gray-200', 'bg-zinc-800/40 border-b border-zinc-700')}>
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
                    <th className={`py-3 px-4 text-left w-[30%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('name')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Name
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left w-[15%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignedTo')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Assigned To
                        {getSortIcon('assignedTo')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left w-[15%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignee')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Assignee
                        {getSortIcon('assignee')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-center w-[12%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignedDate')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors mx-auto w-full text-center ${tableHeaderTextClasses}`}
                      >
                        Assigned On
                        {getSortIcon('assignedDate')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left w-[10%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('priority')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Priority
                        {getSortIcon('priority')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left w-[10%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('status')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className={`py-3 px-4 text-left w-[8%] ${tableHeaderTextClasses}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTasks.map((task) => (
                    <tr key={task.TaskID || task._id} className={`${tableRowClasses} transition-colors duration-150 ${getThemeClasses('hover:bg-gray-50/70', 'hover:bg-[#2A2A2A]/40')}`}>
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
                      <td className="py-3 px-4 overflow-hidden">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1 w-full min-w-0">
                            <button
                              onClick={() => handleTaskClick(task.TaskID || task._id, task.ProjectID)}
                              className={getThemeClasses(
                                'text-left hover:text-blue-600 hover:underline transition-colors cursor-pointer font-medium truncate block max-w-full',
                                'text-left hover:text-blue-400 hover:underline transition-colors cursor-pointer font-medium truncate block max-w-full'
                              )}
                              title={task.Name}
                            >
                              {task.Name}
                            </button>
                            <div className="flex items-center gap-1.5">
                              {getTaskTypeBadgeComponent(task.Type)}
                              <span className="md:hidden">
                                {getProjectStatusBadgeComponent(task.Status, true)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0 w-full text-xs">
                            {(task.TaskNumber || task.TicketNumber) && (
                              <span className="font-semibold font-mono text-blue-600 dark:text-blue-400 shrink-0">
                                #{task.TaskNumber || task.TicketNumber}
                              </span>
                            )}
                            {(task.TaskNumber || task.TicketNumber) && task.Description && (
                              <span className="text-gray-300 dark:text-gray-600 shrink-0">•</span>
                            )}
                            <span className={getThemeClasses(
                              'text-xs text-gray-500 truncate block w-full',
                              'text-xs text-gray-400 truncate block w-full'
                            )} title={task.Description}>{task.Description}</span>
                          </div>
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
                      <td className="hidden md:table-cell py-3 px-4 text-left">
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

      {/* Stats Modal for Mobile View */}
      {isStatsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="absolute inset-0" onClick={() => setIsStatsModalOpen(false)} />
          <div className={getThemeClasses(
            'relative w-full max-w-md mx-4 bg-white border border-gray-100 rounded-xl shadow-lg p-6 transform transition-all',
            'relative w-full max-w-md mx-4 bg-dark-bg border border-dark-card rounded-xl shadow-lg p-6 text-white transform transition-all'
          )}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={getThemeClasses('text-lg font-semibold text-gray-900', 'text-lg font-semibold text-white')}>
                Task Analytics
              </h3>
              <button
                onClick={() => setIsStatsModalOpen(false)}
                className={getThemeClasses(
                  'text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors',
                  'text-gray-400 hover:text-gray-300 text-xl font-bold transition-colors'
                )}
              >
                ×
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {/* Total Tasks */}
              <div className={getThemeClasses(
                'bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between',
                'bg-dark-card/50 border border-gray-700/50 p-4 rounded-xl flex items-center justify-between'
              )}>
                <div>
                  <p className={getThemeClasses('text-xs font-semibold text-gray-505 text-gray-500', 'text-xs font-semibold text-gray-400')}>Total Tasks</p>
                  <p className={getThemeClasses('text-xl font-bold mt-0.5 text-gray-900', 'text-xl font-bold mt-0.5 text-white')}>{stats.totalTasks}</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-100 bg-blue-900/20 text-blue-600 text-blue-400">
                  <FaTasks className="w-4 h-4" />
                </div>
              </div>

              {/* Completed */}
              <div className={getThemeClasses(
                'bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between',
                'bg-dark-card/50 border border-gray-700/50 p-4 rounded-xl flex items-center justify-between'
              )}>
                <div>
                  <p className={getThemeClasses('text-xs font-semibold text-gray-505 text-gray-500', 'text-xs font-semibold text-gray-400')}>Completed</p>
                  <p className={getThemeClasses('text-xl font-bold mt-0.5 text-green-600', 'text-xl font-bold mt-0.5 text-green-400')}>{stats.completedTasks}</p>
                </div>
                <div className="p-2 rounded-xl bg-green-100 bg-green-900/20 text-green-600 text-green-400">
                  <FaCheckCircle className="w-4 h-4" />
                </div>
              </div>

              {/* Overdue */}
              <div className={getThemeClasses(
                'bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between',
                'bg-dark-card/50 border border-gray-700/50 p-4 rounded-xl flex items-center justify-between'
              )}>
                <div>
                  <p className={getThemeClasses('text-xs font-semibold text-gray-505 text-gray-500', 'text-xs font-semibold text-gray-400')}>Overdue</p>
                  <p className={getThemeClasses('text-xl font-bold mt-0.5 text-red-650 text-red-500', 'text-xl font-bold mt-0.5 text-red-400')}>{stats.overdueTasks}</p>
                </div>
                <div className="p-2 rounded-xl bg-red-100 bg-red-900/20 text-red-600 text-red-400">
                  <FaExclamationTriangle className="w-4 h-4" />
                </div>
              </div>

              {/* Due Today */}
              <div className={getThemeClasses(
                'bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between',
                'bg-dark-card/50 border border-gray-700/50 p-4 rounded-xl flex items-center justify-between'
              )}>
                <div>
                  <p className={getThemeClasses('text-xs font-semibold text-gray-505 text-gray-500', 'text-xs font-semibold text-gray-400')}>Due Today</p>
                  <p className={getThemeClasses('text-xl font-bold mt-0.5 text-yellow-650 text-yellow-500', 'text-xl font-bold mt-0.5 text-yellow-400')}>{stats.dueTodayTasks}</p>
                </div>
                <div className="p-2 rounded-xl bg-yellow-100 bg-yellow-900/20 text-yellow-600 text-yellow-400">
                  <FaCalendarAlt className="w-4 h-4" />
                </div>
              </div>

              {/* High Priority */}
              <div className={getThemeClasses(
                'bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between',
                'bg-dark-card/50 border border-gray-700/50 p-4 rounded-xl flex items-center justify-between'
              )}>
                <div>
                  <p className={getThemeClasses('text-xs font-semibold text-gray-505 text-gray-500', 'text-xs font-semibold text-gray-400')}>High Priority</p>
                  <p className={getThemeClasses('text-xl font-bold mt-0.5 text-red-650 text-red-500', 'text-xl font-bold mt-0.5 text-red-455 text-red-400')}>{stats.highPriorityTasks}</p>
                </div>
                <div className="p-2 rounded-xl bg-red-100 bg-red-900/20 text-red-600 text-red-400">
                  <FaFlag className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsStatsModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
