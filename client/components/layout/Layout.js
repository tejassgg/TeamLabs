import Navbar from './Navbar';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { FaCog, FaChevronLeft, FaFolder, FaBookOpen, FaTasks, FaUsers, FaHome, FaChevronDown, FaChevronUp, FaBars, FaTimes, FaArrowRight, FaRegMoon, FaRegSun, FaChevronRight, FaRobot, FaRegClipboard, FaProjectDiagram } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { projectService, taskService, authService } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';
import { useToast } from '../../context/ToastContext';
import TooltipPortal from '../shared/TooltipPortal';
import Link from 'next/link';
import FirstTimeSetup from '../shared/FirstTimeSetup';
import ChatBot from '../shared/ChatBot';
import DynamicBreadcrumb from '../shared/DynamicBreadcrumb';
import { useThemeClasses } from '../shared/hooks/useThemeClasses';
import ReleaseNotificationBanner from '../shared/ReleaseNotificationBanner';
import useReleaseNotifications from '../../hooks/useReleaseNotifications';

const Sidebar = ({ isMobile, isOpen, setIsOpen, setSidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isTeamsOpen, setIsTeamsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const { teams, projects, organization, userDetails } = useGlobal();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const activeTeamId = router.pathname.startsWith('/team/') ? router.query.teamId : null;
  const activeProjectId = router.pathname.startsWith('/project/') ? router.query.projectId : null;
  const getThemeClasses = useThemeClasses();

  // Load collapsed state from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        const collapsedState = JSON.parse(saved);
        setCollapsed(collapsedState);
        setSidebarCollapsed(collapsedState);
      }
    }
  }, [setSidebarCollapsed]);

  // Fetch subscription data for admin users
  const fetchSubscriptionData = async () => {
    if (userDetails?.role === 'Admin' || userDetails?.role === 1) {
      setLoadingSubscription(true);
      try {
        const response = await authService.getSubscriptionData(userDetails.organizationID);
        const newSubscriptionData = response.data.subscription;
        setSubscriptionData(newSubscriptionData);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoadingSubscription(false);
      }
    }
  };

  // Refresh subscription data when component becomes visible (user returns from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userDetails?.organizationID) {
        fetchSubscriptionData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userDetails?.organizationID, userDetails?.role]);

  const handleNavigation = (path) => {
    router.push(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleCollapseToggle = () => {
    if (!isMobile) {
      const newCollapsed = !collapsed;
      setCollapsed(newCollapsed);
      setSidebarCollapsed(newCollapsed);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
      }
    }
  };

  // Sidebar button component
  const SidebarButton = ({ icon, label, active, onClick, theme }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
    const btnRef = useRef(null);

    const handleShowTooltip = () => {
      if (!isMobile && collapsed && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setTooltipPos({
          left: rect.right + 8,
          top: rect.top + rect.height / 2
        });
        setShowTooltip(true);
      }
    };

    return (
      <div className="relative">
        <button
          ref={btnRef}
          className={`flex items-center gap-3 w-full px-3 py-1 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-sm
            ${active
              ? `${theme === 'dark'
                ? 'bg-blue-800 text-white font-bold border-l-4 border-blue-400'
                : 'bg-blue-100 text-blue-700 font-bold border-l-4 border-blue-500'} shadow-sm`
              : theme === 'dark'
                ? 'hover:bg-[#424242] text-blue-200 border-l-4 border-transparent'
                : 'hover:bg-blue-100 text-blue-600 border-l-4 border-transparent'}
            ${!isMobile && collapsed ? 'justify-center' : 'justify-start'}
          `}
          onClick={onClick}
          tabIndex={0}
          aria-label={label}
          onMouseEnter={handleShowTooltip}
          onFocus={handleShowTooltip}
          onMouseLeave={() => setShowTooltip(false)}
          onBlur={() => setShowTooltip(false)}
        >
          <span className="text-lg">{icon}</span>
          {(!isMobile && collapsed) ? null : <span className="font-medium text-base">{label}</span>}
        </button>
        {!isMobile && collapsed && showTooltip && (
          <TooltipPortal position={tooltipPos}>
            <div className={`px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-50 text-sm font-semibold
              ${theme === 'dark' ? 'bg-[#424242] text-[#F3F6FA]' : 'bg-white text-gray-900 border border-gray-200'}`}
            >
              {label}
            </div>
          </TooltipPortal>
        )}
      </div>
    );
  };

  return (
    <>
      <aside className={`fixed top-0 left-0 h-screen z-40 transition-all duration-500 ease-in-out
          ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'}
          flex flex-col justify-between shadow-2xl
          ${isMobile ?
          `w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}` :
          `${collapsed ? 'w-16' : 'w-64'}`}
        `}
        style={{
          minHeight: '100vh',
          overflow: 'visible',
          transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Top: Logo & Collapse Button */}
        <div className={`flex items-center justify-between p-3 border-b ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} bg-transparent`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Dynamic Org Initials */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>
              {organization && organization.Name
                ? organization.Name.split(' ').map(n => n[0]).join('')
                : 'OG'}
            </div>
            {/* Dynamic Org Name */}
            <span className={`font-bold text-lg truncate transition-all duration-300 ease-in-out ${!isMobile && collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100'
              }`}>
              {organization && organization.Name
                ? organization.Name
                : 'Organization'}
            </span>
          </div>
          {!isMobile && (
            <button
              className={`p-1.5 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 flex-shrink-0 ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
              onClick={handleCollapseToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
          <SidebarButton
            icon={<FaHome className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="Dashboard"
            active={router.pathname === '/dashboard'}
            onClick={() => handleNavigation('/dashboard')}
            theme={theme}
          />
          <SidebarButton
            icon={<FaTasks className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="My Tasks"
            active={router.pathname === '/my-tasks'}
            onClick={() => handleNavigation('/my-tasks')}
            theme={theme}
          />
          <SidebarButton
            icon={<FaTasks className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="TimeSheet"
            active={router.pathname === '/timesheet'}
            onClick={() => handleNavigation('/timesheet')}
            theme={theme}
          />
          {/* Messages Section */}
          <div className={`border-b ${getThemeClasses('border-gray-200', 'border-gray-700')} pb-2`}>
            <SidebarButton
              icon={<FaBookOpen className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
              label="Messages"
              active={router.pathname === '/messages'}
              onClick={() => handleNavigation('/messages')}
              theme={theme}
            />
          </div>

          <SidebarButton
            icon={<FaRegClipboard className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="Kanban Board"
            active={router.pathname === '/kanban'}
            onClick={() => handleNavigation('/kanban')}
            theme={theme}
          />

          <div className={`border-b ${getThemeClasses('border-gray-200', 'border-gray-700')} pb-2`}>
            <SidebarButton
              icon={<FaBookOpen className={getThemeClasses('text-blue-600', 'text-blue-300')} />}
              label="Query Board"
              active={router.pathname === '/query'}
              onClick={() => handleNavigation('/query')}
              theme={theme}
            />
          </div>
          {/* Teams Section */}
          <div>
            <div className={`flex items-center ${(!isMobile && collapsed) ? 'justify-center' : 'justify-between'}`}>
              <SidebarButton
                icon={<FaUsers className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
                label="Teams"
                active={router.pathname === '/teams'}
                onClick={() => handleNavigation('/teams')}
                theme={theme}
              />
              {(!isMobile && collapsed) ? null : (
                <button
                  className={`p-1.5 rounded-full transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
                  aria-label={`${isTeamsOpen ? 'Collapse' : 'Expand'} Teams`}
                  onClick={() => setIsTeamsOpen((prev) => !prev)}
                >
                  {isTeamsOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
              )}
            </div>
            {isTeamsOpen && (!isMobile && collapsed ? false : true) && (
              <ul className="ml-8 mt-1 space-y-1">
                {teams.length === 0 ? (
                  <li key="no-teams" className="text-gray-400 italic">No Teams</li>
                ) : (
                  teams.map((team) => {
                    if (!team || !team.TeamID) return null;
                    const teamId = team.TeamID || team._id;
                    const teamName = team.TeamName || 'Unnamed Team';

                    return (
                      <li key={teamId}>
                        <button
                          className={`w-full text-left px-2 py-1 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${activeTeamId === teamId
                            ? (theme === 'dark' ? 'bg-blue-900 text-blue-200 font-medium' : 'bg-blue-50 text-blue-600 font-medium')
                            : (theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-gray-100')}`}
                          onClick={() => handleNavigation(`/team/${teamId}`)}
                        >
                          {teamName}
                        </button>
                      </li>
                    );
                  }).filter(Boolean)
                )}
              </ul>
            )}
          </div>

          {/* Projects Section */}
          <div>
            <div className={`flex items-center ${(!isMobile && collapsed) ? 'justify-center' : 'justify-between'}`}>
              <SidebarButton
                icon={<FaProjectDiagram className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
                label="Projects"
                active={router.pathname === '/projects'}
                onClick={() => handleNavigation('/projects')}
                theme={theme}
              />
              {(!isMobile && collapsed) ? null : (
                <button
                  className={`p-1.5 rounded-full transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
                  aria-label={`${isProjectsOpen ? 'Collapse' : 'Expand'} Projects`}
                  onClick={() => setIsProjectsOpen((prev) => !prev)}
                >
                  {isProjectsOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
              )}
            </div>
            {isProjectsOpen && (!isMobile && collapsed ? false : true) && (
              <ul className="ml-8 mt-1 space-y-1">
                {projects.length === 0 ? (
                  <li key="no-projects" className="text-gray-400 italic">No Projects</li>
                ) : (
                  projects.map((project) => {
                    if (!project || !project.ProjectID) return null;
                    const projectId = project.ProjectID || project._id;
                    const projectName = project.Name || 'Unnamed Project';

                    return (
                      <li key={projectId}>
                        <button
                          className={`w-full text-left px-2 py-1 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${activeProjectId === projectId
                            ? (theme === 'dark' ? 'bg-blue-900 text-blue-200 font-medium' : 'bg-blue-50 text-blue-600 font-medium')
                            : (theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-gray-100')}`}
                          onClick={() => handleNavigation(`/project/${projectId}`)}
                        >
                          {projectName}
                        </button>
                      </li>
                    );
                  }).filter(Boolean)
                )}
              </ul>
            )}
          </div>

        </nav>

        {/* Bottom: Logout & Theme Switch */}
        <div className={`flex flex-col gap-2 p-4 border-t ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} bg-transparent`}>
          {/* Upgrade to Premium Button - Only show for admin users without premium */}
          {userDetails?.role === 'Admin' && !userDetails?.isPremiumMember && (!isMobile && !collapsed) && (
            <button onClick={() => handleNavigation('/settings?tab=billing')}
              className={`w-full flex items-center ${(!isMobile && collapsed) ? 'justify-center gap-2' : 'justify-between gap-3'} px-3 py-2 rounded-xl font-medium transition-all duration-200 border ${theme === 'dark' ? 'bg-[#232323] border-[#424242] text-[#F3F6FA] hover:bg-[#2a2a2a]' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`} >
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Upgrade to</span>
                <span className="px-2 py-1 rounded-md bg-black text-white text-xs font-semibold tracking-wide">PRO</span>
              </div>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full ${theme === 'dark' ? 'bg-[#1a1a1a] text-gray-200' : 'bg-white text-gray-600'} border ${theme === 'dark' ? 'border-[#2e2e2e]' : 'border-gray-200'}`}>
                <FaArrowRight size={12} className='-rotate-45 hover:transform hover:-rotate-90 transition-all duration-200' />
              </div>
            </button>
          )}

          <SidebarButton
            icon={<FaRobot className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="AI Assistant"
            onClick={() => setIsChatBotOpen(!isChatBotOpen)}
            theme={theme}
          />
          <div className={`flex items-center ${(!isMobile && collapsed) ? 'justify-center ml-6' : 'justify-between'}`}>
            <SidebarButton
              icon={<FaCog className='text-red-600' />}
              label="Settings"
              onClick={async () => {
                router.push('/settings');
              }}
              theme={theme}
            />
            <button
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${(!isMobile && collapsed) ? 'justify-center' : 'justify-start'}`}
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
            >
              {(!isMobile && collapsed) ? null : (
                <span className="ml-auto">
                  <span
                    className={`relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in ml-2 ${theme === 'dark' ? 'bg-blue-700' : 'bg-gray-300'}`}
                    style={{ borderRadius: '9999px' }}
                  >
                    <span className={`absolute left-1 top-1 w-4 h-4 rounded-full flex items-center justify-center transition-transform duration-200 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'} `}>
                      {theme === 'dark' ? (
                        <FaRegSun className="text-yellow-300" size={12} />
                      ) : (
                        <FaRegMoon className="text-gray-600" size={12} />
                      )}
                    </span>
                  </span>
                </span>
              )}
            </button>
          </div>
          {collapsed && (
            <button
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${(!isMobile && collapsed) ? 'justify-center' : 'justify-start'}`}
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
            >
              {(isMobile) ? null : (
                <span className="ml-auto">
                  <span
                    className={`relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in ml-2 ${theme === 'dark' ? 'bg-blue-700' : 'bg-gray-300'}`}
                    style={{ borderRadius: '9999px' }}
                  >
                    <span className={`absolute left-1 top-1 w-4 h-4 rounded-full flex items-center justify-center transition-transform duration-200 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'} `}>
                      {theme === 'dark' ? (
                        <FaRegSun className="text-yellow-300" size={12} />
                      ) : (
                        <FaRegMoon className="text-gray-600" size={12} />
                      )}
                    </span>
                  </span>
                </span>
              )}
            </button>
          )}
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            className={`absolute top-4 right-4 z-50 p-2 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            onClick={() => setIsOpen(false)}
          >
            <FaTimes size={24} />
          </button>
        )}
      </aside>
      {/* ChatBot Component */}
      <ChatBot isOpen={isChatBotOpen} onToggle={setIsChatBotOpen} showButton={false} />
    </>
  );
};

const isProfileComplete = (userDetails) => {
  if (!userDetails) {
    return false;
  }
  // Adjust these fields as per your required profile fields
  const requiredFields = [
    'phone', 'address', 'city', 'state', 'country', 'firstName', 'lastName', 'email'
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
  const { teams, projects, tasksDetails, userDetails, loading, setProjects, setTasksDetails } = useGlobal();
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Release notifications hook
  const { latestRelease, hasNewRelease, versionUpdateAvailable, dismissRelease, markAsSeen } = useReleaseNotifications();

  // Apply user's font preference on mount
  useEffect(() => {
    if (userDetails?.fontFamily) {
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
      const selectedFont = fontOptions.find(f => f.value === userDetails.fontFamily);
      if (selectedFont) {
        document.documentElement.style.setProperty('--font-family', selectedFont.fontFamily);
      }
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
    if (path === '/my-tasks') return 'My Tasks';
    if (path === '/timesheet') return 'Timesheet';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    if (path === '/messages') return 'Messages';
    if (path === '/payment') return 'Payment';
    if (path === '/query') return 'Query Board';
    if (path === '/teams') return 'Teams';
    if (path === '/projects') return 'Projects';

    // Dynamic routes
    if (path === '/task/[taskId]') {
      const taskId = query.taskId;
      const task = tasksDetails.find(t => t.TaskID === taskId || t._id === taskId);
      return task?.Name || 'Task Details';
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
    if (isRedirecting) return; // Prevent redirect loops
    // Never redirect away from /profile or /welcome for onboarding
    if (
      userDetails &&
      !userDetails.onboardingCompleted &&
      !['/', '/profile'].includes(router.pathname)
    ) {
      // console.log('Show onboarding modal due to incomplete onboarding:', {
      //   onboardingCompleted: userDetails.onboardingCompleted,
      //   onboardingStep: userDetails.onboardingStep,
      //   currentPath: router.pathname
      // });
      setIsRedirecting(true);
      setShowFirstTimeSetup(true);
    }
  }, [userDetails, router.pathname, router, isRedirecting]);

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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'}`}>
      <div id="mobile-sidebar">
        <Sidebar isMobile={isMobile} isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} setSidebarCollapsed={setSidebarCollapsed} />
      </div>
      {/* Mobile Navbar with Hamburger */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 ${theme === 'dark' ? 'bg-[#232323]/95 backdrop-blur-sm border-b border-gray-800' : 'bg-white/95 backdrop-blur-sm border-b border-gray-200'} shadow-md`}>
        <div className="px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              className={`sidebar-toggle p-2 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} transform hover:scale-110`}
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
              <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
                TeamLabs
              </Link>
            )}
          </div>
          <div>
            <Navbar
              isMobile={true}
              theme={theme}
              toggleTheme={toggleTheme}
              onLogout={logout}
              pageTitle={currentPageTitle}
              versionUpdateAvailable={versionUpdateAvailable}
              latestVersion={latestRelease?.version}
              onVersionUpdateClick={() => {
                // Scroll to release notification banner
                const banner = document.querySelector('[data-release-banner]');
                if (banner) {
                  banner.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div
        className={`transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'ml-16' : !isMobile ? 'ml-64' : ''} ${isMobile ? 'ml-0 pt-14' : ''}`}
        style={{ transition: 'margin-left 500ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {!isMobile && (
          <div className="flex justify-center">
            <div style={{ width: '100%' }}>
              <Navbar
                theme={theme}
                toggleTheme={toggleTheme}
                onLogout={logout}
                pageTitle={currentPageTitle}
                versionUpdateAvailable={versionUpdateAvailable}
                latestVersion={latestRelease?.version}
                onVersionUpdateClick={() => {
                  // Scroll to release notification banner
                  const banner = document.querySelector('[data-release-banner]');
                  if (banner) {
                    banner.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            </div>
          </div>
        )}
        <main className={`overflow-y-auto min-h-[calc(100vh-80px)] ${theme === 'dark' ? 'bg-[#18181b] text-white' : ''}`}>
          {/* Release Notification Banner */}
          {latestRelease && (
            <div className="p-2" data-release-banner>
              <ReleaseNotificationBanner
                onClose={() => {
                  dismissRelease(latestRelease._id);
                  markAsSeen(latestRelease._id);
                }}
              />
            </div>
          )}

          <div className="p-2">
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
            {children}
          </div>
        </main>
      </div>
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && (
        <div
          className={`fixed inset-0 z-30 transition-all duration-500 ease-in-out ${isMobileSidebarOpen
            ? 'bg-black bg-opacity-50 pointer-events-auto'
            : 'bg-transparent pointer-events-none'
            }`}
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* First Time Setup Modal */}
      <FirstTimeSetup
        isOpen={showFirstTimeSetup}
        onComplete={() => setShowFirstTimeSetup(false)}
      />
    </div>
  );
};

export default Layout;