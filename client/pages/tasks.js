import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaTasks, FaCalendarAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaSearch, FaSpinner, FaFlag, FaEdit, FaTrash, FaTimes, FaShieldAlt, FaRocket, FaSort, FaSortUp, FaSortDown, FaFilter, FaChevronLeft, FaChevronRight, FaChartBar, FaDownload } from 'react-icons/fa';
import useSWR from 'swr';

import { useTheme } from '../context/ThemeContext';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import { getPriorityBadge, getPriorityStyle } from '../components/task/TaskTypeBadge';
import CustomDropdown from '../components/shared/CustomDropdown';
import SearchableDropdown from '../components/shared/SearchableDropdown';
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
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [assignedByFilter, setAssignedByFilter] = useState('');
  const [sortBy, setSortBy] = useState('assignedDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterAnim, setFilterAnim] = useState(false);

  // Animate in
  useEffect(() => {
    if (isFilterModalOpen) {
      const id = requestAnimationFrame(() => setFilterAnim(true));
      return () => cancelAnimationFrame(id);
    } else {
      setFilterAnim(false);
    }
  }, [isFilterModalOpen]);

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

  const [scope, setScope] = useState('includes-me');

  // SWR-based query for personal tasks and stats
  // SWR-based query for personal tasks and stats (always fetch 'all' scope from server)
  const { data: myTasksRes, error: fetchError } = useSWR(
    userDetails?._id ? ['/auth/tasks-data', 'all'] : null,
    ([url, s]) => authService.getTasksData('all'),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const loading = !myTasksRes && !fetchError;

  // Helper to calculate statistics based on active scope
  const calculateStats = (scopeTasks) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const completed = scopeTasks.filter(task => task.Status === 'Completed' || task.Status === 6 || task.Status === '6');

    const overdue = scopeTasks.filter(task => {
      if (!task.Deadline || task.Status === 'Completed' || task.Status === 6 || task.Status === '6') return false;
      const deadline = new Date(task.Deadline);
      return deadline < today;
    });

    const dueToday = scopeTasks.filter(task => {
      if (!task.Deadline || task.Status === 'Completed' || task.Status === 6 || task.Status === '6') return false;
      const deadline = new Date(task.Deadline);
      const taskDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      return taskDate.getTime() === today.getTime();
    });

    const highPriority = scopeTasks.filter(task => task.Priority === 1 || task.Priority === 2 || task.Priority === '1' || task.Priority === '2' || task.Priority === 'High' || task.Priority === 'Critical' || task.Priority === 0 || task.Priority === '0');

    setStats({
      totalTasks: scopeTasks.length,
      completedTasks: completed.length,
      overdueTasks: overdue.length,
      dueTodayTasks: dueToday.length,
      highPriorityTasks: highPriority.length
    });
  };

  // Synchronize query response with page state hooks
  useEffect(() => {
    if (myTasksRes && myTasksRes.success) {
      const { tasks, projects } = myTasksRes.data;
      setTasks(tasks);
      setProjects(projects);
    }
  }, [myTasksRes]);

  // Recalculate statistics when scope or tasks change
  useEffect(() => {
    const scopeTasks = scope === 'includes-me'
      ? tasks.filter(task =>
        task.Assignee === userDetails?._id ||
        task.AssignedTo === userDetails?._id ||
        task.CreatedBy === userDetails?._id
      )
      : tasks;
    calculateStats(scopeTasks);
  }, [tasks, scope, userDetails]);

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
  }, [tasks, scope, searchTerm, statusFilter, priorityFilter, projectFilter, taskTypeFilter, assignedToFilter, assignedByFilter, sortBy, sortOrder]);


  const applyFilters = () => {
    const scopeTasks = scope === 'includes-me'
      ? tasks.filter(task =>
        task.Assignee === userDetails?._id ||
        task.AssignedTo === userDetails?._id ||
        task.CreatedBy === userDetails?._id
      )
      : tasks;

    let filtered = [...scopeTasks];
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
      filtered = filtered.filter(task => String(task.Priority) === String(priorityFilter));
    }

    // Project filter
    if (projectFilter) {
      filtered = filtered.filter(task => task.ProjectID === projectFilter);
    }

    // Task Type filter
    if (taskTypeFilter) {
      filtered = filtered.filter(task => task.Type === taskTypeFilter);
    }

    // Assigned To filter
    if (assignedToFilter) {
      filtered = filtered.filter(task => task.AssignedTo === assignedToFilter);
    }

    // Assigned By filter
    if (assignedByFilter) {
      filtered = filtered.filter(task => task.Assignee === assignedByFilter);
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
          const priorityOrder = {
            'Critical': 4, 1: 4, '1': 4, 0: 4, '0': 4,
            'High': 3, 2: 3, '2': 3,
            'Medium': 2, 3: 2, '3': 2,
            'Low': 1, 4: 1, '4': 1
          };
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

  const exportToCSV = () => {
    const headers = ['Task Name', 'Assignee', 'Creator', 'Assigned On', 'Priority', 'Status'];
    const csvData = filteredTasks.map(task => {
      const assigneeName = task.AssignedToDetails?.fullName
        ? `${task.AssignedToDetails.fullName} (@${task.AssignedToDetails.username})`
        : 'Not Assigned';
      const creatorName = task.AssigneeDetails?.fullName
        ? `${task.AssigneeDetails.fullName} (@${task.AssigneeDetails.username})`
        : 'Not Assigned';
      const assignedOn = task.AssignedDate ? new Date(task.AssignedDate).toLocaleDateString() : '';
      const priorityLabel = task.Priority === 0 || task.Priority === '0' ? 'Critical' : task.Priority || 'None';

      const statusObj = projectStatuses.find(s => s.Code === Number(task.Status) || s.Code === task.Status);
      const statusLabel = statusObj ? statusObj.Value : 'Unknown';

      return [
        task.Name || '',
        assigneeName,
        creatorName,
        assignedOn,
        priorityLabel,
        statusLabel
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className={`${getThemeClasses('bg-white', 'bg-dark-bg')}`}>
      <Head>
        <title>Tasks - TeamLabs</title>
        <meta name="description" content="View and manage all your assigned tasks, projects, and teams" />
      </Head>

      <div>


        {/* Stats Card - Unified Layout matching Project details page hero */}
        <div className="w-full mb-6">
          <div className={`border rounded-2xl p-6 max-w-5xl ${getThemeClasses(
            "bg-white border-gray-200 shadow-sm",
            "dark:bg-dark-bg dark:border-zinc-800/80 dark:shadow-none"
          )}`}>
            {(() => {
              const totalTasksCount = stats.totalTasks;
              const completedTasksCount = stats.completedTasks;
              const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

              const radius = 44;
              const strokeWidth = 8;
              const C = 2 * Math.PI * radius; // 276.46
              const gap = 10;

              let greenLength = 0;
              let grayLength = 0;
              let greenOffset = 0;
              let grayOffset = 0;

              if (progressPercent === 100) {
                greenLength = C;
                grayLength = 0;
              } else if (progressPercent === 0) {
                greenLength = 0;
                grayLength = C;
              } else {
                greenLength = (progressPercent / 100) * C - gap;
                grayLength = ((100 - progressPercent) / 100) * C - gap;
                greenOffset = -gap / 2;
                grayOffset = -(greenLength + 1.5 * gap);
              }

              let healthText = 'On Track';
              let healthColor = 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800';
              if (stats.overdueTasks > 0) {
                healthText = 'Needs Attention';
                healthColor = 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800';
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full">
                  {/* Left Column: Cards (lg:col-span-6) */}
                  <div className="lg:col-span-4 grid grid-cols-2 gap-3 w-full lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
                    {/* Total Tasks */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-between hover:shadow-md transition-all duration-300 ${getThemeClasses(
                      'border-gray-100 bg-gray-50/50',
                      'border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-800/20'
                    )}`}>
                      <div className="flex items-center justify-between">
                        <span className={getThemeClasses('text-xs font-semibold text-gray-500 uppercase tracking-wider', 'text-xs font-semibold text-gray-400 uppercase tracking-wider')}>Total Tasks</span>
                        <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                          <FaTasks className="w-3 h-3" />
                        </div>
                      </div>
                      <span className={getThemeClasses('text-xl font-bold text-gray-900 mt-2', 'text-xl font-bold text-white mt-2')}>
                        {stats.totalTasks}
                      </span>
                    </div>

                    {/* Completed */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-between hover:shadow-md transition-all duration-300 ${getThemeClasses(
                      'border-gray-100 bg-gray-50/50',
                      'border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-800/20'
                    )}`}>
                      <div className="flex items-center justify-between">
                        <span className={getThemeClasses('text-xs font-semibold text-gray-500 uppercase tracking-wider', 'text-xs font-semibold text-gray-400 uppercase tracking-wider')}>Completed</span>
                        <div className="p-1 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600">
                          <FaCheckCircle className="w-3 h-3" />
                        </div>
                      </div>
                      <span className={getThemeClasses('text-xl font-bold text-green-650 mt-2', 'text-xl font-bold text-green-400 mt-2')}>
                        {stats.completedTasks}
                      </span>
                    </div>

                    {/* Overdue Card */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-between hover:shadow-md transition-all duration-300 ${getThemeClasses(
                      'border-gray-100 bg-gray-50/50',
                      'border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-800/20'
                    )}`}>
                      <div className="flex items-center justify-between">
                        <span className={getThemeClasses('text-xs font-semibold text-gray-500 uppercase tracking-wider', 'text-xs font-semibold text-gray-400 uppercase tracking-wider')}>Overdue</span>
                        <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-955/40 dark:bg-red-950/40">
                          <FaExclamationTriangle className="w-3 h-3 text-red-655" />
                        </div>
                      </div>
                      <span className={`text-xl font-bold mt-2 ${stats.overdueTasks > 0 ? 'text-red-600' : getThemeClasses('text-gray-900', 'text-white')}`}>
                        {stats.overdueTasks}
                      </span>
                    </div>

                    {/* High Priority Card */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-between hover:shadow-md transition-all duration-300 ${getThemeClasses(
                      'border-gray-100 bg-gray-50/50',
                      'border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-800/20'
                    )}`}>
                      <div className="flex items-center justify-between">
                        <span className={getThemeClasses('text-xs font-semibold text-gray-500 uppercase tracking-wider', 'text-xs font-semibold text-gray-400 uppercase tracking-wider')}>High Priority</span>
                        <div className="p-1.5 rounded-lg bg-[#FFF2E5] dark:bg-[#FFA500]/10">
                          <FaFlag className="w-3 h-3 text-orange-655" />
                        </div>
                      </div>
                      <span className={`text-xl font-bold mt-2 ${stats.highPriorityTasks > 0 ? 'text-orange-600' : getThemeClasses('text-gray-900', 'text-white')}`}>
                        {stats.highPriorityTasks}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Progress Bar (lg:col-span-2) */}
                  <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2 lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
                    <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Gray remainder path */}
                        {grayLength > 0 && (
                          <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            className="text-gray-100 dark:text-zinc-850 dark:text-zinc-800"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${grayLength} ${C}`}
                            strokeDashoffset={grayOffset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                          />
                        )}
                        {/* Emerald progress path */}
                        {greenLength > 0 && (
                          <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            className="text-emerald-500 dark:text-emerald-400"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${greenLength} ${C}`}
                            strokeDashoffset={greenOffset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                          />
                        )}
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className={getThemeClasses(
                          "text-xl font-extrabold tracking-tight text-slate-800",
                          "text-white"
                        )}>
                          {progressPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Health Status Badge */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${healthColor}`}>
                      {healthText}
                    </span>

                    {/* Completion stats text */}
                    <p className={getThemeClasses('text-xs font-semibold text-gray-500 mt-0.5', 'text-xs font-semibold text-gray-400 mt-0.5')}>
                      {stats.completedTasks} of {stats.totalTasks} completed
                    </p>
                  </div>

                  {/* Right Column: Search & Filter Controls (lg:col-span-4) */}
                  <div className="lg:col-span-6 flex flex-col gap-3 w-full h-full justify-end">
                    {/* Top: Search bar */}
                    <div className="relative w-full">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={getThemeClasses(
                          'w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500',
                          'w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-dark-border bg-dark-card text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                        )}
                      />
                    </div>

                    {/* Bottom: Scope Toggle, Filter and Export CSV */}
                    <div className="flex flex-wrap items-center gap-2 w-full justify-between sm:justify-end">
                      {/* Scope Toggles */}
                      <div className={`flex rounded-lg p-0.5 border text-sm font-medium ${getThemeClasses(
                        'border-gray-300 bg-gray-50',
                        'dark:border-dark-border dark:bg-dark-card'
                      )}`}>
                        <button
                          onClick={() => setScope('includes-me')}
                          className={`px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${scope === 'includes-me'
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : theme === 'dark' ? 'text-gray-400 hover:text-gray-250 hover:text-gray-205 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                          Includes Me
                        </button>
                        <button
                          onClick={() => setScope('all')}
                          className={`px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${scope === 'all'
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : theme === 'dark' ? 'text-gray-400 hover:text-gray-250 hover:text-gray-205 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                          All Tasks
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 relative" ref={filterDropdownRef}>
                        <button
                          onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
                          className={getThemeClasses(
                            'flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-100 hover:bg-blue-200/80 text-blue-600 text-sm font-medium transition-all duration-200 border-0 cursor-pointer',
                            'flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-950/50 hover:bg-blue-900/60 text-blue-400 text-sm font-medium transition-all duration-200 border border-blue-900/50 cursor-pointer'
                          )}
                        >
                          <FaFilter className="w-3.5 h-3.5" />
                          <span>Filter</span>
                          {((statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0) + (projectFilter ? 1 : 0) + (taskTypeFilter ? 1 : 0) + (assignedToFilter ? 1 : 0) + (assignedByFilter ? 1 : 0)) > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {(statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0) + (projectFilter ? 1 : 0) + (taskTypeFilter ? 1 : 0) + (assignedToFilter ? 1 : 0) + (assignedByFilter ? 1 : 0)}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={exportToCSV}
                          className={getThemeClasses(
                            'flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#00AA4F] hover:bg-[#009042] text-white text-sm font-medium transition-all duration-200 border-0 cursor-pointer',
                            'flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-medium transition-all duration-200 border-0 cursor-pointer'
                          )}
                        >
                          <FaDownload className="w-3.5 h-3.5 text-white" />
                          <span>Export CSV</span>
                        </button>

                        {/* Filter Dropdown */}
                        {isFilterModalOpen && (
                          <div
                            className={getThemeClasses(
                              `absolute right-0 top-full mt-2 w-80 z-50 rounded-xl border shadow-lg p-4 transition-all duration-200 ease-out origin-top-right ${filterAnim ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'} bg-white border-gray-200`,
                              `absolute right-0 top-full mt-2 w-80 z-50 rounded-xl border shadow-lg p-4 transition-all duration-200 ease-out origin-top-right ${filterAnim ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'} bg-dark-card border-gray-600`
                            )}
                            role="dialog"
                            aria-label="Filters"
                          >
                            <div className="grid grid-cols-1 gap-4">
                              {/* Status */}
                              <div>
                                <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'text-gray-300')}>Status</label>
                                <SearchableDropdown
                                  value={statusFilter}
                                  onChange={(val) => setStatusFilter(val)}
                                  options={[
                                    { value: '', label: 'All Statuses' },
                                    ...projectStatuses.map(status => ({ value: status.Code, label: status.Value }))
                                  ]}
                                  placeholder="All Statuses"
                                  renderSelected={(opt) => opt.value === '' ? 'All Statuses' : getProjectStatusBadgeComponent(opt.value, true)}
                                  renderOption={(opt) => opt.value === '' ? 'All Statuses' : getProjectStatusBadgeComponent(opt.value, true)}
                                />
                              </div>

                              {/* Priority */}
                              <div>
                                <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'text-gray-300')}>Priority</label>
                                <SearchableDropdown
                                  value={priorityFilter}
                                  onChange={(val) => setPriorityFilter(val)}
                                  options={[
                                    { value: '', label: 'All Priorities' },
                                    { value: 1, label: 'Critical' },
                                    { value: 2, label: 'High' },
                                    { value: 3, label: 'Medium' },
                                    { value: 4, label: 'Low' }
                                  ]}
                                  placeholder="All Priorities"
                                  renderSelected={(opt) => opt.value === '' ? 'All Priorities' : getPriorityBadge(opt.value)}
                                  renderOption={(opt) => opt.value === '' ? 'All Priorities' : getPriorityBadge(opt.value)}
                                />
                              </div>

                              {/* Project */}
                              <div>
                                <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'text-gray-300')}>Project</label>
                                <SearchableDropdown
                                  value={projectFilter}
                                  onChange={(val) => setProjectFilter(val)}
                                  options={[
                                    { value: '', label: 'All Projects' },
                                    ...projects.map(project => ({ value: project.ProjectID, label: project.Name }))
                                  ]}
                                  placeholder="All Projects"
                                />
                              </div>

                              {/* Task Type */}
                              <div>
                                <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'text-gray-300')}>Task Type</label>
                                <SearchableDropdown
                                  value={taskTypeFilter}
                                  onChange={(val) => setTaskTypeFilter(val)}
                                  options={[
                                    { value: '', label: 'All Types' },
                                    ...Array.from(new Set(tasks.map(t => t.Type).filter(Boolean))).map(type => ({ value: type, label: type }))
                                  ]}
                                  placeholder="All Types"
                                  renderSelected={(opt) => opt.value === '' ? 'All Types' : getTaskTypeBadgeComponent(opt.value)}
                                  renderOption={(opt) => opt.value === '' ? 'All Types' : getTaskTypeBadgeComponent(opt.value)}
                                />
                              </div>

                              {/* Assigned To */}
                              <div>
                                <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'text-gray-300')}>Assigned To</label>
                                <SearchableDropdown
                                  value={assignedToFilter}
                                  onChange={(val) => setAssignedToFilter(val)}
                                  options={[
                                    { value: '', label: 'All Assignees' },
                                    ...Array.from(new Set(tasks.map(t => t.AssignedTo).filter(Boolean))).map(userId => {
                                      const t = tasks.find(tt => tt.AssignedTo === userId);
                                      return { value: userId, label: t?.AssignedToDetails?.fullName || userId };
                                    })
                                  ]}
                                  placeholder="All Assignees"
                                />
                              </div>

                              {/* Assigned By */}
                              <div>
                                <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'text-gray-300')}>Assigned By</label>
                                <SearchableDropdown
                                  value={assignedByFilter}
                                  onChange={(val) => setAssignedByFilter(val)}
                                  options={[
                                    { value: '', label: 'All Creators' },
                                    ...Array.from(new Set(tasks.map(t => t.Assignee).filter(Boolean))).map(userId => {
                                      const t = tasks.find(tt => tt.Assignee === userId);
                                      return { value: userId, label: t?.AssigneeDetails?.fullName || userId };
                                    })
                                  ]}
                                  placeholder="All Creators"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <button
                                onClick={() => {
                                  setStatusFilter('');
                                  setPriorityFilter('');
                                  setProjectFilter('');
                                  setTaskTypeFilter('');
                                  setAssignedToFilter('');
                                  setAssignedByFilter('');
                                }}
                                className={getThemeClasses(
                                  'px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50',
                                  'px-3 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800'
                                )}
                              >
                                Reset
                              </button>
                              <button
                                onClick={() => setIsFilterModalOpen(false)}
                                className={getThemeClasses(
                                  'px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700',
                                  'px-3 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600'
                                )}
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-1">
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
                    <th className="py-3 pl-4 text-center w-[50px]">
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
                    <th className={`py-3 px-4 text-left w-[42%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('name')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Name
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left w-[12%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignedTo')}
                        className={`flex items-center gap-2 whitespace-nowrap hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Assigned To
                        {getSortIcon('assignedTo')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left w-[12%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignee')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Assignee
                        {getSortIcon('assignee')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-center w-[11%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('assignedDate')}
                        className={`flex items-center justify-center gap-2 whitespace-nowrap hover:text-blue-600 hover:text-blue-400 transition-colors mx-auto w-full text-center ${tableHeaderTextClasses}`}
                      >
                        Assigned On
                        {getSortIcon('assignedDate')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left w-[8%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('priority')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Priority
                        {getSortIcon('priority')}
                      </button>
                    </th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left w-[9%] ${tableHeaderTextClasses}`}>
                      <button
                        onClick={() => handleHeaderSort('status')}
                        className={`flex items-center gap-2 hover:text-blue-600 hover:text-blue-400 transition-colors w-full text-left ${tableHeaderTextClasses}`}
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className={`py-3 px-4 text-left w-[6%] ${tableHeaderTextClasses}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTasks.map((task) => (
                    <tr key={task.TaskID || task._id} className={`${tableRowClasses} transition-colors duration-150 ${getThemeClasses('hover:bg-gray-50/70', 'hover:bg-[#2A2A2A]/40')}`}>
                      <td className="py-3 pl-4 text-center">
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
                              {task.Name && task.Name.length > 70 ? `${task.Name.substring(0, 70)}...` : task.Name}
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
                              <span>{task.AssignedToDetails.username}</span>
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
                              <span className={tableTextClasses}>{task.AssignedToDetails.fullName.split(' ')[0]} <span className={'text-xs'}>{isMe(task.AssignedTo) ? ' (You)' : ''}</span></span>
                              {task.AssignedToDetails.teamName && (
                                <span className={`text-xs ${tableSecondaryTextClasses}`}>{task.AssignedToDetails.teamName}</span>
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
                              <span className={tableTextClasses}>{task.AssigneeDetails.fullName.split(' ')[0]} <span className={'text-xs'}>{isMe(task.Assignee) ? ' (You)' : ''}</span></span>
                              {task.AssigneeDetails.teamName && (
                                <span className={`text-xs ${tableSecondaryTextClasses}`}>{task.AssigneeDetails.teamName}</span>
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
                          <div className="flex flex-col items-center leading-tight text-sm">
                            <span >{new Date(task.AssignedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
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
                          {task.Type !== 'User Story' && getPriorityBadge(task.Priority)}
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
                              'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                              'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
                            )}
                            title="Edit Task"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleTaskClick(task.TaskID || task._id, task.ProjectID)}
                            className={getThemeClasses(
                              'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                              'text-red-400 bg-red-900/50 hover:bg-red-800/50'
                            )}
                            title="Delete Task"
                          >
                            <FaTrash size={12} />
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
    </div >
  );
};

export default TasksPage;
