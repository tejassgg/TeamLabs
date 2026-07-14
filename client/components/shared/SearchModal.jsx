import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { searchService } from '../../services/api';
import {
  FaSearch,
  FaTimes,
  FaProjectDiagram,
  FaUsers,
  FaUser,
  FaTasks,
  FaFileAlt,
  FaComment,
  FaCalendarAlt,
  FaCheckCircle,
  FaSyncAlt,
  FaFolder,
  FaLevelUpAlt,
  FaChartPie,
  FaExclamationTriangle,
  FaCog,
  FaCreditCard,
  FaPlug,
  FaChevronDown
} from 'react-icons/fa';

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightText = (text, query) => {
  if (!query || !text) return text;
  try {
    const parts = text.toString().split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/80 text-gray-900 dark:text-white rounded px-0.5 font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  } catch (e) {
    return text;
  }
};

const SearchModal = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { userDetails, searchData, searchLoading, fetchSearchDataGlobal } = useGlobal();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Live search backend states
  const [backendData, setBackendData] = useState(null);
  const [isSearchingBackend, setIsSearchingBackend] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'projects' | 'tasks' | null

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const resultsRefs = useRef([]);

  const data = searchData;
  const loading = searchLoading;

  const projectList = data?.projects || [];
  const taskList = data?.tasks || [];

  // Perform backend query
  const performBackendSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingBackend(true);
    setError(null);
    try {
      const responseData = await searchService.search(searchQuery.trim());
      setBackendData(responseData);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Error searching backend:', err);
      setError('Database search failed. Please try again.');
    } finally {
      setIsSearchingBackend(false);
    }
  };

  // Fetch on mount/open (ensuring prefetch data is populated fallback)
  useEffect(() => {
    if (isOpen) {
      if (!searchData) {
        fetchSearchDataGlobal();
      }
      setSearchQuery('');
      setSelectedIndex(0);
      setActiveTab('all');
      setBackendData(null);
      setActiveDropdown(null);
      // Focus input on next render cycle
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, searchData]);

  // Reset backend results when query or tab changes
  useEffect(() => {
    setBackendData(null);
    setActiveDropdown(null);
  }, [searchQuery, activeTab]);

  // Close dropdowns on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.quick-action-pill')) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeDropdown]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (shouldRender) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [shouldRender]);

  // Process data into search items
  const getSearchItems = () => {
    const activeData = backendData || data;
    if (!activeData) return [];

    const items = [];

    // Projects
    if (activeData.projects) {
      activeData.projects.forEach(p => {
        items.push({
          type: 'project',
          category: 'Projects',
          id: p.ProjectID,
          name: p.Name,
          desc: p.Description || 'No description',
          url: `/project/${p.ProjectID}`,
          icon: <FaProjectDiagram className="text-blue-500" />
        });
      });
    }

    // Teams
    if (activeData.teams) {
      activeData.teams.forEach(t => {
        items.push({
          type: 'team',
          category: 'Teams',
          id: t.TeamID,
          name: t.TeamName,
          desc: t.TeamDescription || 'No description',
          url: `/team/${t.TeamID}`,
          icon: <FaUsers style={{ color: t.TeamColor || '#3B82F6' }} />
        });
      });
    }

    // Users (Members)
    if (activeData.users) {
      activeData.users.forEach(u => {
        items.push({
          type: 'member',
          category: 'Members',
          id: u.username,
          name: `${u.firstName} ${u.lastName} (${u.username})`,
          desc: `${u.email} • Role: ${u.role || 'Member'}`,
          url: u.username === userDetails?.username ? '/profile' : null,
          image: u.profileImage,
          icon: <FaUser className="text-purple-500" />
        });
      });
    }

    // Tasks
    if (activeData.tasks) {
      activeData.tasks.forEach(t => {
        items.push({
          type: 'task',
          category: 'Tasks',
          id: t.TaskID,
          name: `[${t.TicketNumber || 'Task'}] ${t.Name}`,
          desc: `${t.Type} • Priority: ${t.Priority} • Status: ${getTaskStatusLabel(t.Status)}`,
          url: `/task/${t.TaskID}`,
          icon: <FaTasks className="text-green-500" />
        });
      });
    }

    // Files (Attachments)
    if (activeData.attachments) {
      activeData.attachments.forEach(a => {
        const sizeMB = a.FileSize ? `${(a.FileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size';
        items.push({
          type: 'file',
          category: 'Files',
          id: a.AttachmentID,
          name: a.Filename,
          desc: `Uploaded by ${a.UploadedBy} • ${sizeMB}`,
          url: a.FileURL,
          isExternal: true,
          icon: <FaFileAlt className="text-indigo-500" />
        });
      });
    }

    // Comments
    if (activeData.comments) {
      activeData.comments.forEach(c => {
        items.push({
          type: 'comment',
          category: 'Comments',
          id: c.CommentID,
          name: `Comment by ${c.Author}`,
          desc: `"${c.Content.length > 80 ? c.Content.substring(0, 80) + '...' : c.Content}"`,
          url: `/task/${c.TaskID}`,
          icon: <FaComment className="text-pink-500" />
        });
      });
    }

    // Meetings
    if (activeData.meetings) {
      activeData.meetings.forEach(m => {
        const dateStr = m.StartTime ? new Date(m.StartTime).toLocaleString() : 'No date';
        items.push({
          type: 'meeting',
          category: 'Meetings',
          id: m.MeetingID,
          name: m.Title,
          desc: `${m.Description || 'No description'} • Starts: ${dateStr}`,
          url: `/team/${m.TeamID_FK}`,
          icon: <FaCalendarAlt className="text-rose-500" />
        });
      });
    }

    // Subtasks
    if (activeData.subtasks) {
      activeData.subtasks.forEach(s => {
        items.push({
          type: 'subtask',
          category: 'Subtasks',
          id: s.SubtaskID,
          name: `Subtask: ${s.Name}`,
          desc: s.IsCompleted ? 'Completed' : 'Pending',
          url: `/task/${s.TaskID_FK}`,
          icon: <FaCheckCircle className={s.IsCompleted ? 'text-green-500' : 'text-gray-400'} />
        });
      });
    }

    // Recent Updates (Activities)
    if (activeData.recentUpdates) {
      activeData.recentUpdates.forEach(act => {
        const userFullName = act.user ? `${act.user.firstName} ${act.user.lastName}` : 'System';
        const dateStr = act.timestamp ? new Date(act.timestamp).toLocaleString() : '';
        items.push({
          type: 'update',
          category: 'Updates',
          id: act._id,
          name: `${userFullName}: ${act.details || act.type}`,
          desc: `${dateStr} • Status: ${act.status}`,
          url: act.metadata?.taskId ? `/task/${act.metadata.taskId}` :
            act.metadata?.projectId ? `/project/${act.metadata.projectId}` :
              act.metadata?.teamId ? `/team/${act.metadata.teamId}` : null,
          icon: <FaSyncAlt className="text-amber-500" />
        });
      });
    }

    return items;
  };

  const getTaskStatusLabel = (statusCode) => {
    const statuses = {
      1: 'Not Assigned',
      2: 'Assigned',
      3: 'In Progress',
      4: 'QA',
      5: 'Deployment',
      6: 'Completed'
    };
    return statuses[statusCode] || 'Unknown';
  };

  const allItems = getSearchItems();

  // Define Category Order and Titles
  const categoryOrder = [
    'project',
    'team',
    'task',
    'subtask',
    'meeting',
    'member',
    'file',
    'comment',
    'update',
    'backend-search-trigger'
  ];
  const categoryTitles = {
    project: 'Projects',
    team: 'Teams',
    task: 'Tasks',
    subtask: 'Subtasks',
    meeting: 'Meetings',
    member: 'Members',
    file: 'Files',
    comment: 'Comments',
    update: 'Recent Updates',
    'backend-search-trigger': 'Database Search'
  };

  // Group and limit items
  const getGroupedAndLimitedResults = () => {
    const query = searchQuery.trim().toLowerCase();

    // 1. If empty query and on 'All Results' tab, show Quick Actions, Main Actions & Contacts matching the image!
    if (!query && activeTab === 'all') {
      const mainActions = [
        {
          type: 'main-action',
          id: 'dashboard-overview',
          name: 'Dashboard Overview',
          desc: 'View organization dashboard and statistics',
          url: '/dashboard',
          shortcut: 'D',
          icon: <FaSyncAlt className="text-blue-500" />
        },
        {
          type: 'main-action',
          id: 'my-tasks',
          name: 'View My Tasks',
          desc: 'View your assigned issues and tasks',
          url: '/my-tasks',
          shortcut: 'T',
          icon: <FaTasks className="text-green-500" />
        },
        {
          type: 'main-action',
          id: 'view-projects',
          name: 'View Projects',
          desc: 'Manage and explore projects',
          url: '/projects',
          shortcut: 'P',
          icon: <FaProjectDiagram className="text-purple-500" />
        },
        {
          type: 'main-action',
          id: 'view-teams',
          name: 'View Teams',
          desc: 'Browse organization teams',
          url: '/teams',
          shortcut: 'M',
          icon: <FaUsers className="text-amber-500" />
        }
      ];

      const contacts = [];
      if (data && data.users) {
        data.users.forEach(u => {
          contacts.push({
            type: 'contact',
            id: u.username,
            name: `${u.firstName} ${u.lastName}`,
            desc: `${u.email} • ${u.role || 'Member'}`,
            username: u.username,
            image: u.profileImage,
            url: u.username === userDetails?.username ? '/profile' : null,
            icon: <FaUser className="text-purple-500" />
          });
        });
      }

      const grouped = {
        'main-action': { items: mainActions, totalCount: mainActions.length },
        'contact': { items: contacts.slice(0, 10), totalCount: contacts.length }
      };

      const displayedResults = [
        ...mainActions,
        ...grouped['contact'].items
      ];

      return { grouped, displayedResults };
    }

    // 2. Filter items by Tab (if query is typed)
    let filtered = allItems;
    if (activeTab !== 'all') {
      filtered = allItems.filter(item => item.type === activeTab);
    }

    // 3. Filter by Search Query
    if (query && !backendData) {
      filtered = filtered.filter(item => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.desc.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      });
    }

    // 4. Group items and count totals
    const grouped = {};
    categoryOrder.forEach(cat => {
      grouped[cat] = {
        items: [],
        totalCount: 0
      };
    });

    filtered.forEach(item => {
      if (grouped[item.type]) {
        grouped[item.type].totalCount++;
        const limitPerSection = activeTab === 'all' ? 4 : 20;
        if (grouped[item.type].items.length < limitPerSection) {
          grouped[item.type].items.push(item);
        }
      }
    });

    const hasLocalMatches = filtered.length > 0;

    // 5. Inject virtual trigger row if query is typed, not found locally, and not already fetched from backend
    if (query && !backendData && !hasLocalMatches) {
      const triggerItem = {
        type: 'backend-search-trigger',
        isBackendSearchTrigger: true,
        category: 'Database Search',
        id: 'backend-search-trigger',
        name: `Search database for "${searchQuery}"`,
        desc: 'No local matches found. Press Enter to search the entire organization database.',
        icon: <FaSearch className="text-blue-500 animate-pulse" />
      };
      grouped['backend-search-trigger'].items.push(triggerItem);
      grouped['backend-search-trigger'].totalCount = 1;
    }

    // 6. Flatten only the limited items in strict category order for keyboard navigation
    const displayedResults = [];
    categoryOrder.forEach(cat => {
      if (grouped[cat]) {
        displayedResults.push(...grouped[cat].items);
      }
    });

    return { grouped, displayedResults };
  };

  const { grouped, displayedResults } = getGroupedAndLimitedResults();

  // Reset selected index when filters change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, activeTab]);

  // Navigate to item URL
  const handleItemSelect = (item) => {
    if (!item) return;
    onClose();

    if (item.isExternal && item.url) {
      window.open(item.url, '_blank');
    } else if (item.url) {
      router.push(item.url);
    }
  };

  // Keyboard navigation & main action shortcut bindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      // Listen to main action shortcut triggers
      if (e.metaKey || e.ctrlKey) {
        const key = e.key.toLowerCase();
        if (key === 'd') {
          e.preventDefault();
          onClose();
          router.push('/dashboard');
          return;
        } else if (key === 't') {
          e.preventDefault();
          onClose();
          router.push('/my-tasks');
          return;
        } else if (key === 'p') {
          e.preventDefault();
          onClose();
          router.push('/projects');
          return;
        } else if (key === 'm') {
          e.preventDefault();
          onClose();
          router.push('/teams');
          return;
        } else if (key === 'i') {
          e.preventDefault();
          onClose();
          router.push('/profile');
          return;
        }
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = displayedResults.length > 0 ? (prev + 1) % displayedResults.length : 0;
          resultsRefs.current[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = displayedResults.length > 0 ? (prev - 1 + displayedResults.length) % displayedResults.length : 0;
          resultsRefs.current[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (displayedResults[selectedIndex]) {
          const item = displayedResults[selectedIndex];
          if (item.isBackendSearchTrigger) {
            performBackendSearch();
          } else {
            handleItemSelect(item);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, displayedResults, selectedIndex]);

  if (!shouldRender) return null;

  // Tabs structure
  const tabs = [
    { id: 'all', label: 'All Results' },
    { id: 'project', label: 'Projects' },
    { id: 'task', label: 'Tasks' },
    { id: 'team', label: 'Teams' },
    { id: 'file', label: 'Files' },
    { id: 'comment', label: 'Comments' },
    { id: 'meeting', label: 'Meetings' },
    { id: 'subtask', label: 'Subtasks' },
  ];

  // Quick actions layout details
  const quickActions = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartPie />, url: '/dashboard' },
    { id: 'projects', label: 'Projects', icon: <FaFolder />, url: '/projects', hasDropdown: true },
    { id: 'tasks', label: 'Tasks', icon: <FaExclamationTriangle />, url: '/my-tasks', hasDropdown: true },
    { id: 'profile', label: 'Profile', icon: <FaUser />, url: '/profile' },
    { id: 'billing', label: 'Billings', icon: <FaCreditCard />, url: '/settings?tab=billing' },
    { id: 'integrations', label: 'Integrations', icon: <FaPlug />, url: '/settings?tab=integrations' },
    { id: 'settings', label: 'Settings', icon: <FaCog />, url: '/settings' }
  ];

  const getVisibleQuickActions = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return quickActions.filter(action => action.id !== 'integrations' && action.id !== 'settings');
    }
    return quickActions.filter(action => action.label.toLowerCase().includes(query));
  };

  const renderQuickActionPill = (action) => {
    return (
      <div key={action.id} className="relative inline-block quick-action-pill">
        <button
          onClick={(e) => {
            if (action.hasDropdown) {
              e.stopPropagation();
              setActiveDropdown(prev => prev === action.id ? null : action.id);
            } else {
              handleItemSelect(action);
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-colors duration-150 text-xs font-semibold cursor-pointer
            ${theme === 'dark'
              ? 'bg-zinc-800/50 border-zinc-800 text-gray-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300'
            }
          `}
        >
          <span className="text-xs text-blue-600 dark:text-blue-400 flex-shrink-0 flex items-center justify-center">
            {action.icon}
          </span>
          <span>{action.label}</span>
          {action.hasDropdown && (
            <FaChevronDown className="text-xs text-gray-400 dark:text-gray-500" />
          )}
        </button>

        {/* Dropdown menus */}
        {action.id === 'projects' && activeDropdown === 'projects' && (
          <div className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-xl border z-50 py-1 overflow-hidden transition-all duration-200 animate-fadeIn
            ${theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'bg-white border-gray-200 text-gray-900'
            }
          `}>
            <div className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase text-gray-400 border-b border-gray-100 dark:border-zinc-800">
              My Projects
            </div>
            <div className="max-h-48 overflow-y-auto scrollbar-thin">
              {projectList.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400 italic">No projects found</div>
              ) : (
                projectList.map(p => (
                  <div
                    key={p.ProjectID}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemSelect({ url: `/project/${p.ProjectID}` });
                    }}
                    className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors flex items-center gap-2"
                  >
                    <FaProjectDiagram className="text-blue-500 text-xs flex-shrink-0" />
                    <span className="truncate">{p.Name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {action.id === 'tasks' && activeDropdown === 'tasks' && (
          <div className={`absolute top-full left-0 mt-2 w-72 rounded-xl shadow-xl border z-50 py-1 overflow-hidden transition-all duration-200 animate-fadeIn
            ${theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'bg-white border-gray-200 text-gray-900'
            }
          `}>
            <div className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase text-gray-400 border-b border-gray-100 dark:border-zinc-800">
              My Tasks
            </div>
            <div className="max-h-48 overflow-y-auto scrollbar-thin">
              {taskList.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400 italic">No tasks found</div>
              ) : (
                taskList.map(t => (
                  <div
                    key={t.TaskID}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemSelect({ url: `/task/${t.TaskID}` });
                    }}
                    className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors flex items-center gap-2"
                  >
                    <FaTasks className="text-green-500 text-xs flex-shrink-0" />
                    <span className="truncate">[{t.TicketNumber || 'Task'}] {t.Name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 pb-4">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[1px] ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={onClose}
      />

      {/* Outer Layout Wrapper */}
      <div className={`relative w-full max-w-2xl flex flex-col gap-2.5 max-h-[80vh] overflow-visible ${isClosing ? 'animate-slideUp' : 'animate-slideDown'}`}>
        {/* Panel 1: Header Search Input Card */}
        <div className={`w-full rounded-2xl shadow-lg border flex items-center p-2.5 flex-shrink-0
          ${theme === 'dark'
            ? 'bg-zinc-900 border-zinc-800 text-white'
            : 'bg-white border-gray-200 text-gray-900'
          }
        `}>
          <FaSearch className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 ml-3 bg-transparent border-none outline-none text-base placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 focus:outline-none"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 ml-2">
            <kbd className={`px-1.5 py-0.5 rounded text-xs font-sans border shadow-sm select-none
              ${theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-500'
              }
            `}>
              ⌘
            </kbd>
            <span className="text-xs text-gray-400 select-none">+</span>
            <kbd className={`px-2 py-0.5 rounded text-xs font-sans border shadow-sm select-none
              ${theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-500'
              }
            `}>
              /
            </kbd>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close search"
          >
            <FaTimes className="text-gray-400" />
          </button>
        </div>

        {/* Panel 2: Tab Filters & Results Card */}
        <div className={`w-full rounded-2xl shadow-2xl border flex flex-col flex-1 max-h-[80vh] overflow-hidden
          ${theme === 'dark'
            ? 'bg-zinc-900 border-zinc-800 text-white'
            : 'bg-white border-gray-200 text-gray-900'
          }
        `}>

          {/* Tab Filters */}
          <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-zinc-800 select-none overflow-x-auto no-scrollbar flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                ${activeTab === tab.id
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : (theme === 'dark'
                      ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white border border-transparent'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 border border-transparent')
                  }
              `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results Body */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-4"
          >
            {isSearchingBackend ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-t-blue-600 border-gray-200 dark:border-gray-800 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Searching database...</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Fetching organization data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 font-medium mb-1">{error}</p>
                <button
                  onClick={() => fetchSearchDataGlobal(true)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : (!searchQuery && activeTab === 'all') ? (
              /* DEFAULT SCREEN matching the requested design layout */
              <div className="space-y-2">
                {/* Quick Actions Pills */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 px-3 py-2 select-none">
                    <span className={`text-xs font-bold tracking-wider uppercase ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Quick Actions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5 px-3">
                    {getVisibleQuickActions().map(action => renderQuickActionPill(action))}
                  </div>
                </div>

                {/* Main Actions List */}
                <div className="space-y-1">
                  <div className="flex items-center gap-4 px-3 py-2 select-none">
                    <div className={`flex-1 border-t border-gray-200`}></div>
                    <span className={`text-sm font-medium tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`}>
                      Main Actions
                    </span>
                    <div className={`flex-1 border-t border-gray-200`}></div>
                  </div>
                  <div className="space-y-1">
                    {grouped['main-action']?.items.map((item, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          ref={(el) => (resultsRefs.current[idx] = el)}
                          onClick={() => handleItemSelect(item)}
                          className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all duration-150
                          ${isSelected
                              ? (theme === 'dark'
                                ? 'bg-blue-950/30 text-white'
                                : 'bg-blue-50/70 text-blue-900')
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                            }
                        `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 flex items-center justify-center text-base ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              {item.icon}
                            </div>
                            <span className="font-semibold text-sm">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isSelected && (
                              <div className="flex items-center gap-1 text-xs text-blue-500 font-bold mr-2 animate-pulse">
                                <span>OPEN</span>
                                <FaLevelUpAlt className="transform rotate-90 text-xs" />
                              </div>
                            )}
                            <kbd className={`flex items-center justify-center gap-1 w-10 h-6 rounded border shadow-sm select-none text-xs font-sans
                            ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-white border-gray-200 text-gray-400'}
                          `}>
                              <span className="leading-none">⌘</span>
                              <span className="leading-none text-md font-semibold">{item.shortcut}</span>
                            </kbd>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-1">
                  <div className="flex items-center gap-4 px-3 py-2 select-none">
                    <div className={`flex-1 border-t border-gray-200`}></div>
                    <span className={`text-sm font-medium tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`}>
                      Members
                    </span>
                    <div className={`flex-1 border-t border-gray-200`}></div>
                  </div>
                  {grouped['contact']?.items.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-400">No members found</div>
                  ) : (
                    <div className="space-y-1">
                      {grouped['contact']?.items.map((item, idx) => {
                        const absoluteIndex = 4 + idx; // mainActions has 4 items
                        const isSelected = absoluteIndex === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            ref={(el) => (resultsRefs.current[absoluteIndex] = el)}
                            onClick={() => handleItemSelect(item)}
                            className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all duration-150
                            ${isSelected
                                ? (theme === 'dark'
                                  ? 'bg-blue-950/30 text-white'
                                  : 'bg-blue-50/70 text-blue-900')
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                              }
                          `}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {item.image ? (
                                  <img src={item.image} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full">
                                    {item.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm leading-tight">{item.name}</span>
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isSelected && (
                                <div className="flex items-center gap-1 text-xs text-blue-500 font-bold mr-2 animate-pulse">
                                  <span>OPEN</span>
                                  <FaLevelUpAlt className="transform rotate-90 text-xs" />
                                </div>
                              )}
                              <span className={`text-xs font-mono font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                @{item.username}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* SEARCH MATCH RESULTS SECTION */
              <div className="space-y-4">
                {/* Filtered Quick Actions */}
                {activeTab === 'all' && getVisibleQuickActions().length > 0 && (
                  <div className="space-y-2 pb-2">
                    <div className="flex items-center gap-4 px-3 py-2 select-none">
                      <div className={`flex-1 border-t border-gray-200`}></div>
                      <span className={`text-sm font-medium tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`}>
                        Quick Actions
                      </span>
                      <div className={`flex-1 border-t border-gray-200`}></div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 px-3">
                      {getVisibleQuickActions().map(action => renderQuickActionPill(action))}
                    </div>
                  </div>
                )}
                {categoryOrder.map((cat) => {
                  const group = grouped[cat];
                  if (!group || group.items.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-1">
                      {/* Section Header */}
                      <div className="flex items-center gap-4 px-3 py-2 select-none">
                        <div className={`flex-1 border-t ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-100'}`}></div>
                        <span className={`text-sm font-semibold tracking-wider flex items-center gap-1.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          <span>{categoryTitles[cat]}</span>
                          <span className="text-xs font-normal font-mono">({group.totalCount})</span>
                        </span>
                        <div className={`flex-1 border-t ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-100'}`}></div>
                      </div>

                      {/* Section Items */}
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const idx = displayedResults.findIndex(dr => dr.type === item.type && dr.id === item.id);
                          const isSelected = idx === selectedIndex;

                          return (
                            <div
                              key={`${item.type}-${item.id}`}
                              ref={(el) => (resultsRefs.current[idx] = el)}
                              onClick={() => handleItemSelect(item)}
                              className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-150
                              ${isSelected
                                  ? (theme === 'dark'
                                    ? 'bg-blue-950/30 text-white'
                                    : 'bg-blue-50/70 text-blue-900')
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                }
                            `}
                            >
                              {/* Item Icon */}
                              <div className={`p-2 rounded-lg flex-shrink-0 flex items-center justify-center text-base
                              ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}
                            `}>
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt="avatar"
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                ) : (
                                  item.icon
                                )}
                              </div>

                              {/* Item Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-sm truncate">
                                    {highlightText(item.type === 'comment' ? item.desc : item.name, searchQuery)}
                                  </span>
                                </div>
                                <p className={`text-xs mt-0.5 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {highlightText(item.type === 'comment' ? item.name : item.desc, searchQuery)}
                                </p>
                              </div>

                              {/* Quick navigation hint */}
                              {isSelected && (
                                <div className="flex items-center gap-1 text-xs text-blue-500 font-bold self-center flex-shrink-0 animate-pulse">
                                  <span>{item.isBackendSearchTrigger ? 'SEARCH' : 'OPEN'}</span>
                                  <FaLevelUpAlt className="transform rotate-90 text-xs" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Section "+ N more" Indicator */}
                      {group.totalCount > group.items.length && !cat.includes('trigger') && (
                        <div className={`px-3 py-1 text-xs italic ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                          + {group.totalCount - group.items.length} more. Narrow query or select tab to view all.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer shortcuts hint */}
          <div className={`px-4 py-2.5 border-t text-xs flex justify-between items-center select-none flex-shrink-0
          ${theme === 'dark'
              ? 'bg-gray-950/40 border-zinc-800 text-gray-500'
              : 'bg-gray-50 border-gray-100 text-gray-400'
            }
        `}>
            <div className="w-full flex items-center justify-end gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 bg-white dark:bg-gray-800 border rounded shadow-sm">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 bg-white dark:bg-gray-800 border rounded shadow-sm">Enter</kbd> Select
              </span>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-30px);
            opacity: 0;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-fadeOut {
          animation: fadeOut 0.25s ease-in forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default SearchModal;
