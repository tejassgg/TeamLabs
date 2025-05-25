import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaChevronRight, FaChevronLeft, FaFolder, FaBookOpen, FaTasks, FaUsers, FaHome, FaChevronDown, FaBars, FaTimes, FaSignOutAlt, FaRegMoon, FaRegSun } from 'react-icons/fa';
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

const Sidebar = ({ isMobile, isOpen, setIsOpen, setSidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isTeamsOpen, setIsTeamsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isUserStoriesOpen, setIsUserStoriesOpen] = useState(true);
  const { teams, projects, tasksDetails, userDetails, setProjects, setTeams, setTasksDetails, organizations } = useGlobal();
  const canManageTeamsAndProjects = userDetails?.role === 'Admin' || userDetails?.role === 'Owner';

  const activeTeamId = router.pathname.startsWith('/team/') ? router.query.teamId : null;
  const activeProjectId = router.pathname.startsWith('/project/') ? router.query.projectId : null;
  const activeDashboardItem = router.pathname === '/kanban' ? 'kanban' : (router.pathname === '/query' ? 'query' : null);

  const handleAddTeam = async (teamData) => {
    try {
      const newTeam = await teamService.addTeam(teamData);
      setTeams(prevTeams => [...prevTeams, newTeam.team]);
      toast.success('Team added successfully!');
      return newTeam;
    } catch (err) {
      toast.error('Failed to add team');
      throw err;
    }
  };

  const handleAddProject = async (projectData) => {
    try {
      const newProject = await projectService.addProject(projectData);
      setProjects(prevProjects => [...prevProjects, newProject]);
      toast.success('Project added successfully!');
      return newProject;
    } catch (err) {
      toast.error('Failed to add project');
      throw err;
    }
  };

  const handleAddUserStory = async (taskData) => {
    try {
      const newTask = await taskService.addTaskDetails(taskData, 'fromSideBar');
      setTasksDetails(prevTasks => [...prevTasks, newTask]);
      toast.success('Task added successfully!');
    } catch (err) {
      toast.error('Failed to add user story');
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleCollapseToggle = () => {
    setCollapsed((prev) => {
      setSidebarCollapsed(!prev);
      return !prev;
    });
  };

  // Sidebar button component
  const SidebarButton = ({ icon, label, active, onClick, collapsed, theme }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
    const btnRef = useRef(null);

    const handleShowTooltip = () => {
      if (collapsed && btnRef.current) {
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
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors duration-200
            ${active
              ? `${theme === 'dark'
                  ? 'bg-blue-800 text-white font-bold border-l-4 border-blue-400'
                  : 'bg-blue-100 text-blue-700 font-bold border-l-4 border-blue-500'} shadow-sm`
              : theme === 'dark'
                ? 'hover:bg-[#424242] text-blue-200 border-l-4 border-transparent'
                : 'hover:bg-blue-100 text-blue-600 border-l-4 border-transparent'}
            ${collapsed ? 'justify-center' : 'justify-start'}
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
          {!collapsed && <span className="font-medium text-base">{label}</span>}
        </button>
        {collapsed && showTooltip && (
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
  const SidebarCollapsible = ({ icon, label, isOpen, onToggle, items, onAdd, collapsed, activeId, itemKey, itemLabel, onItemClick, canAdd, theme }) => (
    <div>
      <div className="flex items-center justify-between">
        <SidebarButton
          icon={icon}
          label={label}
          onClick={onToggle}
          collapsed={collapsed}
          theme={theme}
        />
        {!collapsed && canAdd && (
          <button
            className={`ml-2 p-1.5 rounded-full transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
            aria-label={`Add ${label}`}
            onClick={onAdd}
          >
            <FaPlus size={14} />
          </button>
        )}
      </div>
      {isOpen && !collapsed && (
        <ul className="ml-8 mt-1 space-y-1">
          {items.length === 0 ? (
            <li className="text-gray-400 italic">No {label}</li>
          ) : (
            items.map((item) => (
              <li key={item[itemKey]}>
                <button
                  className={`w-full text-left px-2 py-1 rounded-lg transition-colors duration-150 ${activeId === item[itemKey]
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

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300
          ${theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : 'bg-white text-gray-900'}
          flex flex-col justify-between shadow-2xl
          ${isMobile ?
            `w-[${collapsed ? '80px' : '280px'}] transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}` :
            `${collapsed ? 'w-20' : 'w-72'}`}
        `}
        style={{ minHeight: '100vh', width: isMobile ? (collapsed ? 80 : 280) : (collapsed ? 80 : 288), overflow: 'visible' }}
      >
        {/* Top: Logo & Collapse Button */}
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'} bg-transparent`}>
          <div className="flex items-center gap-2">
            {/* Dynamic Org Initials */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}> 
              {organizations && organizations.length > 0
                ? organizations.find(org => org._id === userDetails?.organizationID)?.name?.split(' ').map(n => n[0]).join('')
                  || organizations[0].name?.split(' ').map(n => n[0]).join('')
                : 'OG'}
            </div>
            {/* Dynamic Org Name */}
            {!collapsed && (
              <span className="font-bold text-lg truncate max-w-[120px]">
                {organizations && organizations.length > 0
                  ? organizations.find(org => org._id === userDetails?.organizationID)?.name
                    || organizations[0].name
                  : ''}
              </span>
            )}
          </div>
          <button
            className={`ml-2 p-1.5 rounded-full transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
            onClick={handleCollapseToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
          <SidebarButton
            icon={<FaHome className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="Dashboard"
            active={router.pathname === '/dashboard'}
            onClick={() => handleNavigation('/dashboard')}
            collapsed={collapsed}
            theme={theme}
          />
          <SidebarButton
            icon={<FaTasks className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="Kanban Board"
            active={router.pathname === '/kanban'}
            onClick={() => handleNavigation('/kanban')}
            collapsed={collapsed}
            theme={theme}
          />
          <SidebarButton
            icon={<FaBookOpen className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="Query Board"
            active={router.pathname === '/query'}
            onClick={() => handleNavigation('/query')}
            collapsed={collapsed}
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
            collapsed={collapsed}
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
            collapsed={collapsed}
            activeId={activeProjectId}
            itemKey={"ProjectID"}
            itemLabel={"Name"}
            onItemClick={(project) => handleNavigation(`/project/${project.ProjectID || project._id}`)}
            canAdd={canManageTeamsAndProjects}
            theme={theme}
          />

          {/* UserStories (Collapsible) */}
          <SidebarCollapsible
            icon={<FaBookOpen className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} />}
            label="UserStories"
            isOpen={isUserStoriesOpen}
            onToggle={() => setIsUserStoriesOpen((prev) => !prev)}
            items={tasksDetails.filter(task => task.Type === 'User Story')}
            onAdd={() => setIsAddTaskOpen(true)}
            collapsed={collapsed}
            activeId={null}
            itemKey={"_id"}
            itemLabel={"Name"}
            onItemClick={(task) => handleNavigation(`/task/${task._id}`)}
            canAdd={true}
            theme={theme}
          />
        </nav>

        {/* Bottom: Logout & Theme Switch */}
        <div className={`flex flex-col gap-2 p-4 border-t ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'} bg-transparent`}>
          <SidebarButton
            icon={<FaSignOutAlt className={theme === 'dark' ? 'text-red-400' : 'text-red-600'} />}
            label="Logout"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.localStorage.clear();
              }
              router.push('/login');
            }}
            collapsed={collapsed}
            theme={theme}
          />
          <button
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors duration-200 ${collapsed ? 'justify-center' : 'justify-start'} ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
          >
            <span className="text-lg">{theme === 'dark' ? <FaRegSun /> : <FaRegMoon />}</span>
            {!collapsed && <>
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
            </>}
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
            organizationId={userDetails?.organizationID}
            projectOwner={userDetails?._id}
          />
          <AddTaskModal
            isOpen={isAddTaskOpen}
            onClose={() => setIsAddTaskOpen(false)}
            onAddTask={handleAddUserStory}
            mode="fromSideBar"
          />
        </>
      )}
    </>
  );
};

const Layout = ({ children }) => {
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const { logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { showToast } = useToast();

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

  const handleAddTeam = async (teamData) => {
    try {
      const newTeam = await teamService.addTeam(teamData);
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
      showToast('Project added successfully!', 'success');
      return newProject;
    } catch (err) {
      showToast('Failed to add project', 'error');
      throw err;
    }
  };

  const handleAddUserStory = async (taskData) => {
    try {
      const newTask = await taskService.addTask(taskData);
      showToast('Task added successfully!', 'success');
    } catch (err) {
      showToast('Failed to add user story', 'error');
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : 'bg-white text-gray-900'}`}>
      <div id="mobile-sidebar">
        <Sidebar isMobile={isMobile} isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} setSidebarCollapsed={setSidebarCollapsed} />
      </div>
      {/* Mobile Navbar with Hamburger */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 ${theme === 'dark' ? 'bg-[#424242]' : 'bg-gray-200'} shadow-md`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="sidebar-toggle p-2 rounded-lg text-gray-600 hover:bg-gray-300 transition-colors"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <FaBars size={22} />
            </button>
            <div className="text-lg font-bold ml-1">TeamLabs</div>
          </div>
          <div>
            <Navbar isMobile={true} theme={theme} toggleTheme={toggleTheme} onLogout={logout} />
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${isMobile ? 'ml-0 pt-14' : ''}`}
        style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 288) }}
      >
        {!isMobile && (
          <div className="flex justify-center">
            <div style={{ width: '98%' }}>
              <Navbar theme={theme} toggleTheme={toggleTheme} onLogout={logout} />
            </div>
          </div>
        )}
        <main className={`p-4 md:p-8 overflow-y-auto min-h-[calc(100vh-80px)] ${theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : ''}`}>
          {children}
        </main>
        <ChatBot />
      </div>
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;