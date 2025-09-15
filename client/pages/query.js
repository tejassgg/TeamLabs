import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import CustomDropdown from '../components/shared/CustomDropdown';
import { FaSearch, FaDownload, FaSort, FaSortUp, FaSortDown, FaExternalLinkAlt, FaTrash, FaFilter } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import CustomModal from '../components/shared/CustomModal';
import { getPriorityBadge, getTaskTypeBadge } from '../components/task/TaskTypeBadge';

const QueryBoard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { theme } = useTheme();

  // State variables
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [commonTypes, setCommonTypes] = useState({
    taskStatuses: [],
    taskPriorities: [],
    taskTypes: []
  });
  const [filters, setFilters] = useState({
    status: 'all',
    priority: [], // empty = all priorities
    taskType: 'all',
    assignedTo: 'all',
    assignedBy: 'all'
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterAnim, setFilterAnim] = useState(false);
  const filterBtnRef = useRef(null);
  const filterPopoverRef = useRef(null);

  // Handle click outside to close popover
  useEffect(() => {
    if (!showFilterModal) return;
    const handler = (e) => {
      const withinPopover = filterPopoverRef.current && filterPopoverRef.current.contains(e.target);
      const withinButton = filterBtnRef.current && filterBtnRef.current.contains(e.target);
      if (!withinPopover && !withinButton) {
        setShowFilterModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilterModal]);

  // Animate in
  useEffect(() => {
    if (showFilterModal) {
      const id = requestAnimationFrame(() => setFilterAnim(true));
      return () => cancelAnimationFrame(id);
    } else {
      setFilterAnim(false);
    }
  }, [showFilterModal]);

  // Get theme classes
  const getThemeClasses = (baseClasses, darkClasses) => {
    return theme === 'dark' ? `${baseClasses} ${darkClasses}` : baseClasses;
  };

  // Fetch all tasks
  const fetchAllTasks = async () => {
    try {
      setLoading(true);

      if (!user || !user.organizationID) {
        showToast('User organization not found', 'error');
        return;
      }

      const response = await api.get(`/task-details/all?organizationId=${user.organizationID}`);
      setTasks(response.data.tasks || []);
      setFilteredTasks(response.data.tasks || []);
      setCommonTypes(response.data.commonTypes || {
        taskStatuses: [],
        taskPriorities: [],
        taskTypes: []
      });

    } catch (error) {
      console.error('Error fetching tasks:', error);
      showToast('Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load tasks when user is available
  useEffect(() => {
    if (user && user.organizationID) {
      fetchAllTasks();
    }
  }, [user]);

  // Apply filters and search
  useEffect(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.Name?.toLowerCase().includes(q) ||
        task.Description?.toLowerCase().includes(q) ||
        task.AssigneeDetails?.fullName?.toLowerCase().includes(q) ||
        task.AssignedToDetails?.fullName?.toLowerCase().includes(q)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.Status === parseInt(filters.status));
    }

    // Apply priority filter (multi-select)
    if (Array.isArray(filters.priority) && filters.priority.length > 0) {
      filtered = filtered.filter(task => filters.priority.includes(task.Priority));
    }

    // Apply task type filter
    if (filters.taskType !== 'all') {
      filtered = filtered.filter(task => task.Type === filters.taskType);
    }

    // Apply assigned to filter
    if (filters.assignedTo !== 'all') {
      filtered = filtered.filter(task => task.AssignedTo === filters.assignedTo);
    }

    // Apply assigned by filter
    if (filters.assignedBy !== 'all') {
      filtered = filtered.filter(task => task.Assignee === filters.assignedBy);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, filters]);

  // Sort function
  const sortData = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredTasks].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle nested objects
      if (key === 'AssigneeDetails') {
        aValue = a.AssigneeDetails?.fullName || '';
        bValue = b.AssigneeDetails?.fullName || '';
      } else if (key === 'AssignedToDetails') {
        aValue = a.AssignedToDetails?.fullName || '';
        bValue = b.AssignedToDetails?.fullName || '';
      } else if (key === 'AssignedDate') {
        aValue = new Date(a.AssignedDate || 0);
        bValue = new Date(b.AssignedDate || 0);
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredTasks(sorted);
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ?
      <FaSortUp className="text-blue-500" /> :
      <FaSortDown className="text-blue-500" />;
  };

  // Get status badge using Kanban-style styling
  const getStatusBadge = (status) => {
    const statusItem = commonTypes.taskStatuses.find(s => s.Code === status);
    if (!statusItem) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200 shadow-sm transition-all duration-200">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Unknown
        </span>
      );
    }

    // Define status styles similar to Kanban board
    const getStatusStyle = (statusValue) => {
      const lowerValue = statusValue.toLowerCase();
      if (lowerValue.includes('done') || lowerValue.includes('complete')) {
        return {
          bgColor: 'from-green-50 to-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        };
      } else if (lowerValue.includes('progress')) {
        return {
          bgColor: 'from-blue-50 to-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        };
      } else if (lowerValue.includes('cancel') || lowerValue.includes('reject')) {
        return {
          bgColor: 'from-red-50 to-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        };
      } else if (lowerValue.includes('hold') || lowerValue.includes('wait')) {
        return {
          bgColor: 'from-yellow-50 to-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        };
      } else {
        return {
          bgColor: 'from-gray-50 to-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        };
      }
    };

    const style = getStatusStyle(statusItem.Value);

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${style.bgColor} ${style.textColor} border ${style.borderColor} shadow-sm transition-all duration-200`}>
        {style.icon}
        {statusItem.Value}
      </span>
    );
  };

  // Get priority badge using Kanban-style styling
  const getPriorityBadgeComponent = (priority) => {
    const priorityItem = commonTypes.taskPriorities.find(p => p.Value === priority);
    if (!priorityItem) {
      return getPriorityBadge('Medium'); // Use default from TaskTypeBadge
    }

    return getPriorityBadge(priorityItem.Value);
  };

  // Get user initials badge
  const getUserInitialsBadge = (userDetails) => {
    if (!userDetails || !userDetails.fullName) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 text-xs font-medium border border-gray-200">
          ?
        </span>
      );
    }

    const initials = userDetails.fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium border border-blue-200 shadow-sm">
        {initials}
      </span>
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Task Name', 'Assigned Date', 'Assigned To', 'Assigned By', 'Status', 'Priority', 'Task Type'];
    const csvData = filteredTasks.map(task => [
      task.Name || '',
      task.AssignedDate ? new Date(task.AssignedDate).toLocaleDateString() : '',
      task.AssignedToDetails?.fullName || '',
      task.AssigneeDetails?.fullName || '',
      getStatusBadge(task.Status).props.children,
      getPriorityBadge(task.Priority).props.children,
      task.Type || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle delete
  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const deleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await api.delete(`/task-details/${taskToDelete.TaskID}`);
      showToast('Task deleted successfully', 'success');
      fetchAllTasks(); // Refresh the list
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task', 'error');
    }
  };

  return (
    <>
      <Head>
        <title>Query Board - TeamLabs</title>
      </Head>

      <div className="mx-auto">
        {/* Search, Export, and Filter Bar */}
        <div className="flex gap-4 mt-4 mb-4">
          <div className="flex-1 relative">
            <FaSearch className={getThemeClasses("absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", "dark:text-gray-500")} size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={getThemeClasses(
                "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "dark:bg-transparent dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              )}
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="relative">
              <button
                ref={filterBtnRef}
                onClick={() => setShowFilterModal((v) => !v)}
                className={getThemeClasses(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 text-blue-600 bg-blue-100 hover:bg-blue-500 hover:text-white duration-300 rounded-lg transition-colors text-sm",
                  "bg-blue-500 hover:bg-blue-600 text-white hover:text-white"
                )}
                title="Open Filters"
              >
                <FaFilter />
                <span className="hidden sm:inline">Filter</span>
              </button>
              {showFilterModal && (
                <div
                  ref={filterPopoverRef}
                  className={getThemeClasses(
                    `absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 rounded-xl border shadow-lg p-4 transition-all duration-200 ease-out origin-top-right ${filterAnim ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'} bg-white border-gray-200`,
                    `absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 rounded-xl border shadow-lg p-4 transition-all duration-200 ease-out origin-top-right ${filterAnim ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'} bg-[#232323] border-gray-600`
                  )}
                  role="dialog"
                  aria-label="Filters"
                >
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'dark:text-gray-300')}>Status</label>
                      <CustomDropdown
                        value={filters.status}
                        onChange={(val) => setFilters({ ...filters, status: val })}
                        options={[{ value: 'all', label: 'All Status' }, ...commonTypes.taskStatuses.map(s => ({ value: s.Code, label: s.Value }))]}
                        placeholder="All Status"
                        variant="filled"
                        size="md"
                        width="w-full"
                      />
                    </div>

                    <div>
                      <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'dark:text-gray-300')}>Priority</label>
                      <div className="flex flex-wrap gap-2">
                        {[{ Value: 'all', Label: 'All' }, ...commonTypes.taskPriorities.map(p => ({ Value: p.Value, Label: p.Value }))].map(p => {
                          const isAll = p.Value === 'all';
                          const isActive = isAll ? (filters.priority.length === 0) : filters.priority.includes(p.Value);
                          const togglePriority = () => {
                            if (isAll) {
                              setFilters({ ...filters, priority: [] });
                            } else {
                              const set = new Set(filters.priority);
                              if (set.has(p.Value)) set.delete(p.Value); else set.add(p.Value);
                              setFilters({ ...filters, priority: Array.from(set) });
                            }
                          };
                          return (
                            <button
                              key={p.Value}
                              type="button"
                              onClick={togglePriority}
                              className={getThemeClasses(
                                `px-3 py-1.5 rounded-lg text-sm border transition-colors ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`,
                                `${isActive ? 'bg-blue-500 text-white border-blue-500' : 'bg-[#2A2A2A] text-gray-200 border-gray-600 hover:bg-[#333333]'}`
                              )}
                              aria-pressed={isActive}
                            >
                              {p.Label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'dark:text-gray-300')}>Task Type</label>
                      <CustomDropdown
                        value={filters.taskType}
                        onChange={(val) => setFilters({ ...filters, taskType: val })}
                        options={[{ value: 'all', label: 'All Types' }, ...commonTypes.taskTypes.map(t => ({ value: t.Value, label: t.Value }))]}
                        placeholder="All Types"
                        variant="filled"
                        size="md"
                        width="w-full"
                        showSearch={true}
                      />
                    </div>

                    <div>
                      <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'dark:text-gray-300')}>Assigned To</label>
                      <CustomDropdown
                        value={filters.assignedTo}
                        onChange={(val) => setFilters({ ...filters, assignedTo: val })}
                        options={[{ value: 'all', label: 'All Assignees' }, ...Array.from(new Set(tasks.map(task => task.AssignedTo).filter(Boolean))).map(userId => {
                          const t = tasks.find(tt => tt.AssignedTo === userId);
                          return { value: userId, label: t?.AssignedToDetails?.fullName || userId };
                        })]}
                        placeholder="All Assignees"
                        variant="filled"
                        size="md"
                        width="w-full"
                        showSearch={true}
                      />
                    </div>

                    <div>
                      <label className={getThemeClasses('block text-sm font-medium mb-1 text-gray-700', 'dark:text-gray-300')}>Assigned By</label>
                      <CustomDropdown
                        value={filters.assignedBy}
                        onChange={(val) => setFilters({ ...filters, assignedBy: val })}
                        options={[{ value: 'all', label: 'All Assigners' }, ...Array.from(new Set(tasks.map(task => task.Assignee).filter(Boolean))).map(userId => {
                          const t = tasks.find(tt => tt.Assignee === userId);
                          return { value: userId, label: t?.AssigneeDetails?.fullName || userId };
                        })]}
                        placeholder="All Assigners"
                        variant="filled"
                        size="md"
                        width="w-full"
                        showSearch={true}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setFilters({ status: 'all', priority: [], taskType: 'all', assignedTo: 'all', assignedBy: 'all' })}
                      className={getThemeClasses(
                        'px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50',
                        'dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800'
                      )}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowFilterModal(false)}
                      className={getThemeClasses(
                        'px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700',
                        'dark:bg-blue-500 dark:hover:bg-blue-600'
                      )}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={exportToCSV}
              className={getThemeClasses(
                "flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm",
                "dark:bg-green-500 dark:hover:bg-green-600"
              )}
            >
              <FaDownload />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters moved to modal */}

        {/* Results Count */}
        <div className={getThemeClasses("text-sm text-gray-600 mb-4", "dark:text-gray-400")}>
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>

        {/* Tasks Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className={getThemeClasses("ml-3 text-gray-500", "dark:text-gray-400")}>Loading tasks...</span>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className={getThemeClasses("bg-white border border-gray-200 rounded-xl shadow overflow-hidden hidden lg:block", "dark:bg-transparent dark:border-gray-700")}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={getThemeClasses("border-b border-gray-200", "dark:border-gray-700")}>
                      <th
                        className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900 cursor-pointer", "dark:text-gray-100")}
                        onClick={() => sortData('Name')}
                      >
                        <div className="flex items-center gap-2">
                          Task Name
                          {getSortIcon('Name')}
                        </div>
                      </th>
                      <th
                        className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900 cursor-pointer", "dark:text-gray-100")}
                        onClick={() => sortData('AssignedDate')}
                      >
                        <div className="flex items-center gap-2">
                          Assigned Date
                          {getSortIcon('AssignedDate')}
                        </div>
                      </th>
                      <th
                        className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900 cursor-pointer", "dark:text-gray-100")}
                        onClick={() => sortData('AssignedToDetails')}
                      >
                        <div className="flex items-center gap-2">
                          Assigned To
                          {getSortIcon('AssignedToDetails')}
                        </div>
                      </th>
                      <th
                        className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900 cursor-pointer", "dark:text-gray-100")}
                        onClick={() => sortData('AssigneeDetails')}
                      >
                        <div className="flex items-center gap-2">
                          Assigned By
                          {getSortIcon('AssigneeDetails')}
                        </div>
                      </th>
                      <th
                        className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900 cursor-pointer", "dark:text-gray-100")}
                        onClick={() => sortData('Status')}
                      >
                        <div className="flex items-center gap-2">
                          Status
                          {getSortIcon('Status')}
                        </div>
                      </th>
                      <th
                        className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900 cursor-pointer", "dark:text-gray-100")}
                        onClick={() => sortData('Priority')}
                      >
                        <div className="flex items-center gap-2">
                          Priority
                          {getSortIcon('Priority')}
                        </div>
                      </th>
                      <th
                        className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900 cursor-pointer", "dark:text-gray-100")}
                        onClick={() => sortData('Type')}
                      >
                        <div className="flex items-center gap-2">
                          Task Type
                          {getSortIcon('Type')}
                        </div>
                      </th>
                      <th className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900", "dark:text-gray-100")}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => (
                      <tr key={task.TaskID} className={getThemeClasses("border-b border-gray-200 hover:bg-gray-50", "dark:border-gray-700 dark:hover:bg-gray-800")}>
                        <td className="py-3 px-4 flex flex-col">
                          <button
                            onClick={() => window.open(`/task/${task.TaskID}`, '_blank')}
                            className={getThemeClasses(
                              "text-gray-900 font-medium hover:text-blue-600 hover:underline transition-colors duration-200 text-left",
                              "dark:text-gray-100 dark:hover:text-blue-400"
                            )}
                            title="View Task Details"
                          >
                            {task.Name}
                          </button>
                          {task.Description && (
                            <span className={getThemeClasses("text-xs text-gray-500", "dark:text-gray-400")}>
                              {task.Description}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={getThemeClasses("text-gray-700", "dark:text-gray-300")}>
                            {task.AssignedDate ? new Date(task.AssignedDate).toLocaleDateString() : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {getUserInitialsBadge(task.AssignedToDetails)}
                            <span className={getThemeClasses("text-gray-700", "dark:text-gray-300")}>
                              {task.AssignedToDetails?.fullName || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {getUserInitialsBadge(task.AssigneeDetails)}
                            <span className={getThemeClasses("text-gray-700", "dark:text-gray-300")}>
                              {task.AssigneeDetails?.fullName || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(task.Status)}
                        </td>
                        <td className="py-3 px-4">
                          {getPriorityBadgeComponent(task.Priority)}
                        </td>
                        <td className="py-3 px-4">
                          {task.Type ? getTaskTypeBadge(task.Type) : (
                            <span className={getThemeClasses("text-gray-700", "dark:text-gray-300")}>
                              -
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteClick(task)}
                            className={getThemeClasses("p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full", "dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30")}
                            title="Delete Task"
                          >
                            <FaTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredTasks.map(task => (
                <div key={task.TaskID} className={getThemeClasses("bg-white border border-gray-200 rounded-xl shadow p-4", "dark:bg-transparent dark:border-gray-700")}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <button
                        onClick={() => window.open(`/task/${task.TaskID}`, '_blank')}
                        className={getThemeClasses(
                          "text-gray-900 font-medium hover:text-blue-600 hover:underline transition-colors duration-200 text-left text-base",
                          "dark:text-gray-100 dark:hover:text-blue-400"
                        )}
                        title="View Task Details"
                      >
                        {task.Name}
                      </button>
                      {task.Description && (
                        <p className={getThemeClasses("text-xs text-gray-500 mt-1", "dark:text-gray-400")}>
                          {task.Description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteClick(task)}
                      className={getThemeClasses("p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full ml-2", "dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30")}
                      title="Delete Task"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={getThemeClasses("text-gray-500 font-medium", "dark:text-gray-400")}>Assigned Date:</span>
                      <div className={getThemeClasses("text-gray-700", "dark:text-gray-300")}>
                        {task.AssignedDate ? new Date(task.AssignedDate).toLocaleDateString() : '-'}
                      </div>
                    </div>
                    
                    <div>
                      <span className={getThemeClasses("text-gray-500 font-medium", "dark:text-gray-400")}>Status:</span>
                      <div className="mt-1">
                        {getStatusBadge(task.Status)}
                      </div>
                    </div>
                    
                    <div>
                      <span className={getThemeClasses("text-gray-500 font-medium", "dark:text-gray-400")}>Assigned To:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getUserInitialsBadge(task.AssignedToDetails)}
                        <span className={getThemeClasses("text-gray-700", "dark:text-gray-300")}>
                          {task.AssignedToDetails?.fullName || '-'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className={getThemeClasses("text-gray-500 font-medium", "dark:text-gray-400")}>Priority:</span>
                      <div className="mt-1">
                        {getPriorityBadgeComponent(task.Priority)}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <span className={getThemeClasses("text-gray-500 font-medium", "dark:text-gray-400")}>Assigned By:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getUserInitialsBadge(task.AssigneeDetails)}
                        <span className={getThemeClasses("text-gray-700", "dark:text-gray-300")}>
                          {task.AssigneeDetails?.fullName || '-'}
                        </span>
                      </div>
                    </div>
                    
                    {task.Type && (
                      <div className="col-span-2">
                        <span className={getThemeClasses("text-gray-500 font-medium", "dark:text-gray-400")}>Task Type:</span>
                        <div className="mt-1">
                          {getTaskTypeBadge(task.Type)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && filteredTasks.length === 0 && (
          <div className={getThemeClasses("text-center py-12 text-gray-500", "dark:text-gray-400")}>
            <p className="text-lg font-medium mb-2">No tasks found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTaskToDelete(null);
        }}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${taskToDelete?.Name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={deleteTask}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

    </>
  );
};

export default QueryBoard; 