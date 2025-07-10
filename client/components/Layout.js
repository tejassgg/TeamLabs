import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaChevronRight, FaChevronLeft, FaFolder, FaBookOpen, FaTasks, FaUsers, FaHome, FaChevronDown, FaChevronUp, FaBars, FaTimes, FaSignOutAlt, FaRegMoon, FaRegSun, FaCircle } from 'react-icons/fa';
import { useRouter } from 'next/router';
import AddTeamModal from './AddTeamModal';
import { teamService } from '../services/api';
import { projectService } from '../services/api';
import AddProjectModal from './AddProjectModal';
import { useGlobal } from '../context/GlobalContext';
import AddTaskModal from './AddTaskModal';
import { taskService } from '../services/api';
import { useToast } from '../context/ToastContext';
import ChatBot from './ChatBot';
import TooltipPortal from './TooltipPortal';
import Link from 'next/link';


const Sidebar = ({ isMobile, isOpen, setIsOpen, setSidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isTeamsOpen, setIsTeamsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const { teams, projects, user, setProjects, setTeams, setTasksDetails, organization, userDetails } = useGlobal();
  const { showToast } = useToast();
  const canManageTeamsAndProjects = userDetails?.role === 'Admin' || userDetails?.role === 'Owner';
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

  const activeTeamId = router.pathname.startsWith('/team/') ? router.query.teamId : null;
  const activeProjectId = router.pathname.startsWith('/project/') ? router.query.projectId : null;

  // Load collapsed state from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(userDetails);
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        const collapsedState = JSON.parse(saved);
        setCollapsed(collapsedState);
        setSidebarCollapsed(collapsedState);
      }
    }
  }, [setSidebarCollapsed]);

  const handleAddTeam = async (teamData) => {
    try {
      const newTeam = await teamService.addTeam(teamData);
      setTeams(prevTeams => [...prevTeams, newTeam.team]);
      showToast('Team added successfully!', 'success');
      return newTeam;
    } catch (err) {
      showToast('Failed to add team', 'error');
      throw err;
    }
  };

  const handleAddProject = async (projectData) => {
    try {
      const newProject = await projectService.addProject(projectData);
      setProjects(prevProjects => [...prevProjects, newProject]);
      showToast('Project added successfully!', 'success');
      return newProject;
    } catch (err) {
      if (err.status == 403) {
        showToast(err.message, 'warning');
      } else {
        showToast('Failed to add project', 'error');
      }
    }
  };

  const handleAddUserStory = async (taskData) => {
    try {
      const newTask = await taskService.addTaskDetails(taskData, 'fromSidebar');
      setTasksDetails(prevTasks => [...prevTasks, newTask]);
      showToast('Task added successfully!', 'success');
    } catch (err) {
      showToast('Failed to add user story', 'error');
    }
  };

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
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-sm
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

  // Collapsible section component
  const SidebarCollapsible = ({ icon, label, isOpen, onToggle, items, onAdd, activeId, itemKey, itemLabel, onItemClick, canAdd, theme }) => (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <SidebarButton
            icon={icon}
            label={label}
            onClick={onToggle}
            theme={theme}
          />
          {(!isMobile && collapsed) ? null : (
            <button
              className={`p-1.5 rounded-full transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${label}`}
              onClick={onToggle}
            >
              {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
          )}
        </div>
        {(!isMobile && collapsed) ? null : canAdd && (
          <button
            className={`ml-2 p-1.5 rounded-full transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
            aria-label={`Add ${label}`}
            onClick={onAdd}
          >
            <FaPlus size={14} />
          </button>
        )}
      </div>
      {isOpen && (!isMobile && collapsed ? false : true) && (
        <ul className="ml-8 mt-1 space-y-1">
          {items.length === 0 ? (
            <li key={`no-${label.toLowerCase()}`} className="text-gray-400 italic">No {label}</li>
          ) : (
            items.map((item) => (
              <li key={item[itemKey] || item._id || `item-${Math.random()}`}>
                <button
                  className={`w-full text-left px-2 py-1 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${activeId === item[itemKey]
                    ? (theme === 'dark' ? 'bg-blue-900 text-blue-200 font-medium' : 'bg-blue-50 text-blue-600 font-medium')
                    : (theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-gray-100')}`}
                  onClick={() => onItemClick(item)}
                >
                  {item[itemLabel]}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );

  useEffect(() => {
    console.log('Organization data:', organization);
    console.log('User data:', user);
  }, [organization, user]);

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen z-40 transition-all duration-500 ease-in-out
          ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'}
          flex flex-col justify-between shadow-2xl
          ${isMobile ?
            `w-72 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}` :
            `${collapsed ? 'w-20' : 'w-72'}`}
        `}
        style={{ 
          minHeight: '100vh', 
          width: isMobile ? 288 : (collapsed ? 80 : 288), 
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
              {organization && organization.Value 
                ? organization.Value.split(' ').map(n => n[0]).join('') 
                : 'OG'}
            </div>
            {/* Dynamic Org Name */}
            <span className={`font-bold text-lg truncate transition-all duration-300 ease-in-out ${
              !isMobile && collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100'
            }`}>
              {organization && organization.Value 
                ? organization.Value 
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
            label="Kanban Board"
            active={router.pathname === '/kanban'}
            onClick={() => handleNavigation('/kanban')}
            theme={theme}
          />
          <SidebarButton
            icon={<FaBookOpen className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="Query Board"
            active={false}
            onClick={() => setIsComingSoonOpen(true)}
            theme={theme}
          />

          {/* Teams (Collapsible) */}
          <SidebarCollapsible
            icon={<FaUsers className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="Teams"
            isOpen={isTeamsOpen}
            onToggle={() => setIsTeamsOpen((prev) => !prev)}
            items={teams}
            onAdd={() => setIsAddTeamOpen(true)}
            activeId={activeTeamId}
            itemKey={"TeamID"}
            itemLabel={"TeamName"}
            onItemClick={(team) => handleNavigation(`/team/${team.TeamID || team._id}`)}
            canAdd={canManageTeamsAndProjects}
            theme={theme}
          />

          {/* Projects (Collapsible) */}
          <SidebarCollapsible
            icon={<FaFolder className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="Projects"
            isOpen={isProjectsOpen}
            onToggle={() => setIsProjectsOpen((prev) => !prev)}
            items={projects}
            onAdd={() => setIsAddProjectOpen(true)}
            activeId={activeProjectId}
            itemKey={"ProjectID"}
            itemLabel={"Name"}
            onItemClick={(project) => handleNavigation(`/project/${project.ProjectID || project._id}`)}
            canAdd={canManageTeamsAndProjects}
            theme={theme}
          />
        </nav>

        {/* Bottom: Logout & Theme Switch */}
        <div className={`flex flex-col gap-2 p-4 border-t ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} bg-transparent`}>
          <SidebarButton
            icon={<FaSignOutAlt className={theme === 'dark' ? 'text-red-400' : 'text-red-600'} />}
            label="Logout"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.localStorage.clear();
              }
              router.push('/login');
            }}
            theme={theme}
          />
          <button
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${(!isMobile && collapsed) ? 'justify-center' : 'justify-start'} ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
          >
            <span className="text-lg">{theme === 'dark' ? <FaRegSun /> : <FaRegMoon />}</span>
            {(!isMobile && collapsed) ? null : (
              <>
                <span className="font-medium text-base">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                <span className="ml-auto">
                  <span
                    className={`relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in ml-2 ${theme === 'dark' ? 'bg-blue-700' : 'bg-gray-300'}`}
                    style={{ borderRadius: '9999px' }}
                  >
                    <span
                      className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-200 ${theme === 'dark' ? 'bg-yellow-300 translate-x-4' : 'bg-white translate-x-0'}`}
                      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    ></span>
                  </span>
                </span>
              </>
            )}
          </button>
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 z-50"
            onClick={() => setIsOpen(false)}
          >
            <FaTimes size={24} />
          </button>
        )}
      </aside>
      {canManageTeamsAndProjects && (
        <>
          <AddTeamModal
            isOpen={isAddTeamOpen}
            onClose={() => setIsAddTeamOpen(false)}
            onAddTeam={handleAddTeam}
          />
          <AddProjectModal
            isOpen={isAddProjectOpen}
            onClose={() => setIsAddProjectOpen(false)}
            onAddProject={handleAddProject}
            organizationId={user?.organizationID}
            projectOwner={user?._id}
          />
          <AddTaskModal
            isOpen={isAddTaskOpen}
            onClose={() => setIsAddTaskOpen(false)}
            onAddTask={handleAddUserStory}
            mode="fromSidebar"
          />
        </>
      )}
      {isComingSoonOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Coming Soon!</h3>
              <button
                onClick={() => setIsComingSoonOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col items-center justify-center py-6">
              <FaBookOpen size={48} className="mb-4 text-blue-500" />
              <h2 className="text-2xl font-bold mb-2 text-center">Query Board is Coming Soon</h2>
              <p className="text-gray-500 mb-4 text-center">We're working hard to bring you this feature. Stay tuned!</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsComingSoonOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Layout = ({ children }) => {
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const { logout, user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const { teams, projects, tasksDetails } = useGlobal();

  // Dynamic breadcrumb component
  const DynamicBreadcrumb = () => {
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
      
      // Team Details
      if (path === '/team/[teamId]') {
        const teamId = query.teamId;
        const team = teams.find(t => t.TeamID === teamId || t._id === teamId);
        return [
          { label: 'Teams', href: '/dashboard' },
          { label: team?.TeamName || 'Team Details', href: router.asPath, isCurrent: true }
        ];
      }
      
      // Project Details
      if (path === '/project/[projectId]') {
        const projectId = query.projectId;
        const project = projects.find(p => p.ProjectID === projectId || p._id === projectId);
        return [
          { label: 'Projects', href: '/dashboard' },
          { label: project?.Name || 'Project Details', href: router.asPath, isCurrent: true }
        ];
      }
      
      // Task Details
      if (path === '/task/[taskId]') {
        const taskId = query.taskId;
        const task = tasksDetails.find(t => t.TaskID === taskId || t._id === taskId);
        const project = task ? projects.find(p => p.ProjectID === task.ProjectID_FK) : null;
        
        // Enhanced project name detection
        let projectName = 'Project Details';
        let projectHref = '/dashboard';
        
        if (project?.Name) {
          projectName = project.Name;
          projectHref = `/project/${project.ProjectID || project._id}`;
        } else if (task?.ProjectID) {
          // If we have a project ID but no name, show a more descriptive fallback
          projectName = 'Project Details';
          projectHref = `/project/${task.ProjectID}`;
        }
        
        return [
          { label: 'Projects', href: '/dashboard' },
          { label: projectName, href: projectHref },
          { label: task?.Name || 'Task Details', href: router.asPath, isCurrent: true }
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
      <nav className={`flex items-center space-x-2 text-sm h-8 p-8 md:px-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && <FaChevronRight className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />}
            {item.isCurrent ? (
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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'}`}>
      <div id="mobile-sidebar">
        <Sidebar isMobile={isMobile} isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} setSidebarCollapsed={setSidebarCollapsed} />
      </div>
      {/* Mobile Navbar with Hamburger */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 ${theme === 'dark' ? 'bg-[#232323]' : 'bg-gray-200'} shadow-md`}>
        <div className="px-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="sidebar-toggle p-2 rounded-lg text-gray-600 hover:bg-gray-300 transition-all duration-300 ease-in-out transform hover:scale-110"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <FaBars size={22} />
            </button>
            <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
              TeamLabs
            </Link>
          </div>
          <div>
            <Navbar isMobile={true} theme={theme} toggleTheme={toggleTheme} onLogout={logout} />
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div
        className={`transition-all duration-500 ease-in-out ${isMobile ? 'ml-0 pt-14' : ''}`}
        style={{ 
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 288),
          transition: 'margin-left 500ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {!isMobile && (
          <div className="flex justify-center">
            <div style={{ width: '100%' }}>
              <Navbar theme={theme} toggleTheme={toggleTheme} onLogout={logout} />
            </div>
          </div>
        )}
        <main className={`overflow-y-auto min-h-[calc(100vh-80px)] ${theme === 'dark' ? 'bg-[#18181b] text-white' : ''}`}>
          <DynamicBreadcrumb />
          
          <div className={`${router.pathname.startsWith('/task') || router.pathname.startsWith('/project') || router.pathname.startsWith('/team') ? 'px-8' : 'p-8'} md:px-8`}>
            {children}
          </div>
        </main>
        <ChatBot />
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
    </div>
  );
};

export default Layout;