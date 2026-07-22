import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect, useMemo } from 'react';
import { FaCog, FaChevronLeft, FaTasks, FaUsers, FaHome, FaChevronDown, FaChevronUp, FaTimes, FaArrowRight, FaRegMoon, FaRegSun, FaChevronRight, FaRobot, FaRegClipboard, FaProjectDiagram, FaCalendarAlt, FaFlask, FaPlus } from 'react-icons/fa';
import { FaRegMessage } from "react-icons/fa6";
import { useRouter } from 'next/router';
import { authService } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';
import { useToast } from '../../context/ToastContext';
import ChatBot from '../shared/ChatBot';
import ProjectPriorityBadge from '../shared/ProjectPriorityBadge';
import SidebarButton from './SidebarButton';
import { FiCornerDownRight } from 'react-icons/fi';

const Sidebar = ({ isMobile, isOpen, setIsOpen, setSidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isTeamsOpen, setIsTeamsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isExperimentalOpen, setIsExperimentalOpen] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllTeams, setShowAllTeams] = useState(false);
  const { teams, projects, organization, userDetails, updateUser } = useGlobal();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort((a, b) => {
      const pA = a.Priority !== undefined ? a.Priority : 3;
      const pB = b.Priority !== undefined ? b.Priority : 3;
      if (pA !== pB) {
        return pA - pB;
      }
      if (a.DueDate && b.DueDate) {
        return new Date(a.DueDate) - new Date(b.DueDate);
      }
      if (a.DueDate) return -1;
      if (b.DueDate) return 1;
      return 0;
    });
  }, [projects]);

  const handleEnrollExperimental = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsEnrolling(true);
    try {
      const response = await authService.enrollExperimental();
      if (response.success) {
        updateUser({
          ...userDetails,
          isEnrolledInExperimental: true
        });
        showToast('Successfully enrolled in experimental features!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to enroll in experimental features', 'error');
    } finally {
      setIsEnrolling(false);
    }
  };

  const activeTeamId = router.pathname.startsWith('/team/') ? router.query.teamId : null;
  const activeProjectId = router.pathname.startsWith('/project/') ? router.query.projectId : null;
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

  // Fetch on mount or userDetails loaded
  useEffect(() => {
    if (userDetails?.organizationID) {
      fetchSubscriptionData();
    }
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

  return (
    <>
      <aside className={`fixed top-0 left-0 h-[111.2vh] z-40 transition-all duration-500 ease-in-out
          bg-white text-gray-900 dark:bg-dark-bg dark:text-white border-r border-gray-200 dark:border-dark-card
          flex flex-col justify-between shadow-2xl
          ${isMobile ?
          `w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}` :
          `${collapsed ? 'w-16' : 'w-64'}`}
        `}
        style={{
          minHeight: '111.2vh',
          overflow: 'visible',
          transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Top: Logo & Collapse Button */}
        <div className={`relative flex items-center justify-between p-3 border-b border-gray-200 dark:border-dark-card bg-transparent`}>
          <div className="flex items-center flex-1 min-w-0">
            {/* Dynamic Org Initials */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 bg-blue-600 text-white dark:bg-blue-900 dark:text-blue-200`}>
              {organization && organization.Name
                ? organization.Name.split(' ').map(n => n[0]).join('')
                : 'OG'}
            </div>
            {/* Dynamic Org Name */}
            <span className={`font-bold text-lg inline-block truncate transition-all duration-300 ease-in-out origin-left
              ${!isMobile && collapsed ? 'opacity-0 scale-95 max-w-0 ml-0 pointer-events-none' : 'opacity-100 scale-100 max-w-[150px] ml-2'}
            `}>
              {organization && organization.Name
                ? organization.Name
                : 'Organization'}
            </span>
          </div>
          {!isMobile && (
            <button
              className={`absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:scale-110 transition-all duration-300 z-50`}
              onClick={handleCollapseToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto overflow-x-hidden">
          <SidebarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
              </svg>
            }
            label="Dashboard"
            active={router.pathname === '/dashboard'}
            onClick={() => handleNavigation('/dashboard')}
            theme={theme}
            isMobile={isMobile}
            collapsed={collapsed}
          />
          <SidebarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <path d="M9 11l3 3 8-8" />
                <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
              </svg>
            }
            label="Tasks"
            active={router.pathname === '/tasks'}
            onClick={() => handleNavigation('/tasks')}
            theme={theme}
            isMobile={isMobile}
            collapsed={collapsed}
          />
          <SidebarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            }
            label="TimeSheet"
            active={router.pathname === '/timesheet'}
            onClick={() => handleNavigation('/timesheet')}
            theme={theme}
            isMobile={isMobile}
            collapsed={collapsed}
          />
          {/* Messages Section */}
          <SidebarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <path d="M21 11.5a8.38 8.38 0 0 1-9 8.3 8.5 8.5 0 0 1-3.9-.9L3 20l1.9-4.1A8.38 8.38 0 0 1 12 3.5a8.5 8.5 0 0 1 9 8z" />
              </svg>
            }
            label="Messages"
            active={router.pathname === '/messages'}
            onClick={() => handleNavigation('/messages')}
            theme={theme}
            isMobile={isMobile}
            collapsed={collapsed}
          />

          <SidebarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M15 3v10" />
              </svg>
            }
            label="Kanban Board"
            active={router.pathname === '/kanban'}
            onClick={() => handleNavigation('/kanban')}
            theme={theme}
            isMobile={isMobile}
            collapsed={collapsed}
          />

          {/* Playground for tejassgg */}
          {userDetails?.username === 'tejassgg' && (
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
              <SidebarButton
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-300">
                    <path d="M6 3h12" />
                    <path d="M18 21a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2 6 6 0 0 1 .5-2.5l5.5-10.5V5h-2V3h6v2h-2v3l5.5 10.5A6 6 0 0 1 18 21z" />
                  </svg>
                }
                label="Playground"
                active={router.pathname === '/playground'}
                onClick={() => handleNavigation('/playground')}
                theme={theme}
                isMobile={isMobile}
                collapsed={collapsed}
              />
            </div>
          )}

          {/* Teams Section */}
          <div>
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <SidebarButton
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  }
                  label="Teams"
                  active={router.pathname === '/teams'}
                  onClick={() => handleNavigation('/teams')}
                  theme={theme}
                  isMobile={isMobile}
                  collapsed={collapsed}
                />
              </div>
              <div className={`flex items-center gap-1 flex-shrink-0 transition-all duration-300 ease-in-out origin-right
                ${!isMobile && collapsed ? 'opacity-0 scale-90 w-0 max-w-0 pointer-events-none overflow-hidden ml-0' : 'opacity-100 scale-100 max-w-full ml-1'}
              `}>
                <button
                  className={`p-1.5 rounded-full transition hover:bg-blue-100 text-blue-600 dark:hover:bg-dark-hover dark:text-blue-200`}
                  aria-label="Add new team"
                  title="Add Team"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation('/teams?addTeam=1');
                  }}
                >
                  <FaPlus size={12} />
                </button>
                <button
                  className={`p-1.5 rounded-full transition hover:bg-blue-100 text-blue-600 dark:hover:bg-dark-hover dark:text-blue-200`}
                  aria-label={`${isTeamsOpen ? 'Collapse' : 'Expand'} Teams`}
                  onClick={() => setIsTeamsOpen((prev) => !prev)}
                >
                  {isTeamsOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
              </div>
            </div>
            {isTeamsOpen && (!isMobile && collapsed ? false : true) && (
              <>
                <ul className="ml-2 mt-1">
                  {teams.length === 0 ? (
                    <li key="no-teams" className="text-gray-400 italic">No Teams</li>
                  ) : (
                    (showAllTeams ? teams : teams.slice(0, 4)).map((team) => {
                      if (!team || !team.TeamID) return null;
                      const teamId = team.TeamID || team._id;
                      const teamName = team.TeamName || 'Unnamed Team';

                      return (
                        <li key={teamId}>
                          <button
                            className={`w-full text-left px-2 py-1.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${activeTeamId === teamId
                              ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/60 dark:text-blue-200'
                              : 'hover:bg-gray-100 dark:hover:bg-dark-hover dark:text-blue-200 ml-2'}`}
                            onClick={() => handleNavigation(`/team/${teamId}`)}
                            title={teamName}
                          >
                            <span className="flex items-center gap-2 w-full">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-black/10 dark:border-white/10" style={{ backgroundColor: team.TeamColor || '#3B82F6' }}></span>
                              <span className="truncate text-sm font-medium" >{teamName}</span>
                            </span>
                          </button>
                        </li>
                      );
                    }).filter(Boolean)
                  )}
                </ul>
                {teams.length > 4 && (
                  <button
                    onClick={() => setShowAllTeams(!showAllTeams)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mt-2 ml-4 flex items-center gap-1 hover:underline"
                  >
                    {showAllTeams ? 'Show Less' : `Show More (${teams.length - 4} more)`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <SidebarButton
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                      <rect x="3" y="3" width="7" height="9" rx="1" />
                      <rect x="14" y="3" width="7" height="5" rx="1" />
                      <rect x="14" y="12" width="7" height="9" rx="1" />
                      <rect x="3" y="16" width="7" height="5" rx="1" />
                    </svg>
                  }
                  label="Projects"
                  active={router.pathname === '/projects'}
                  onClick={() => handleNavigation('/projects')}
                  theme={theme}
                  isMobile={isMobile}
                  collapsed={collapsed}
                />
              </div>
              <div className={`flex items-center gap-1 flex-shrink-0 transition-all duration-300 ease-in-out origin-right
                ${!isMobile && collapsed ? 'opacity-0 scale-90 w-0 max-w-0 pointer-events-none overflow-hidden ml-0' : 'opacity-100 scale-100 max-w-full ml-1'}
              `}>
                <button
                  className={`p-1.5 rounded-full transition hover:bg-blue-100 text-blue-600 dark:hover:bg-dark-hover dark:text-blue-200`}
                  aria-label="Add new project"
                  title="Add Project"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation('/projects?addProject=1');
                  }}
                >
                  <FaPlus size={12} />
                </button>
                <button
                  className={`p-1.5 rounded-full transition hover:bg-blue-100 text-blue-600 dark:hover:bg-dark-hover dark:text-blue-200`}
                  aria-label={`${isProjectsOpen ? 'Collapse' : 'Expand'} Projects`}
                  onClick={() => setIsProjectsOpen((prev) => !prev)}
                >
                  {isProjectsOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
              </div>
            </div>
            {isProjectsOpen && (!isMobile && collapsed ? false : true) && (
              <>
                <ul className="ml-2 mt-1">
                  {projects.length === 0 ? (
                    <li key="no-projects" className="text-gray-400 italic">No Projects</li>
                  ) : (
                    (showAllProjects ? sortedProjects : sortedProjects.slice(0, 4)).map((project) => {
                      if (!project || !project.ProjectID) return null;
                      const projectId = project.ProjectID || project._id;
                      const rawName = project.Name || 'Unnamed Project';

                      return (
                        <li key={projectId}>
                          <button
                            className={`w-full text-left px-2 py-1.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${activeProjectId === projectId
                              ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/60 dark:text-blue-200'
                              : 'hover:bg-gray-100 dark:hover:bg-dark-hover dark:text-blue-200 ml-2'}`}
                            onClick={() => handleNavigation(`/project/${projectId}`)}
                            title={rawName}
                          >
                            <span className="flex items-center justify-between gap-1.5 w-full">
                              <span className="truncate text-sm font-medium">{rawName}</span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {project.isArchived && (
                                  <span className="text-[9px] opacity-60 font-normal uppercase tracking-wider">
                                    (Archived)
                                  </span>
                                )}
                                <ProjectPriorityBadge priority={project.Priority} />
                              </div>
                            </span>
                          </button>
                        </li>
                      );
                    }).filter(Boolean)
                  )}
                </ul>
                {projects.length > 4 && (
                  <button
                    onClick={() => setShowAllProjects(!showAllProjects)}
                    className="text-xs text-gray-400 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-600 transition-colors ml-4 flex items-center gap-1 hover:underline"
                  >
                    {showAllProjects ? 'Show Less' : `Show More (+${projects.length - 4})`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Experimental Section */}
          <div>
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <SidebarButton
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
                      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.513C3.91 22.124 5.08 24 6.89 24h10.22c1.81 0 2.98-1.876 2.17-3.487l-5.07-10.09a2 2 0 0 1-.21-.896V2h-4z" />
                      <path d="M8.5 2h7" />
                      <path d="M7 16h10" />
                    </svg>
                  }
                  label="Experimental"
                  active={router.pathname.startsWith('/experimental')}
                  onClick={() => {
                    if (!isMobile && collapsed) {
                      handleNavigation('/experimental/automation');
                    } else {
                      setIsExperimentalOpen((prev) => !prev);
                    }
                  }}
                  theme={theme}
                  isMobile={isMobile}
                  collapsed={collapsed}
                />
              </div>
              <div className={`flex items-center gap-1 flex-shrink-0 transition-all duration-300 ease-in-out origin-right
                ${!isMobile && collapsed ? 'opacity-0 scale-90 w-0 max-w-0 pointer-events-none overflow-hidden ml-0' : 'opacity-100 scale-100 max-w-full ml-1'}
              `}>
                <button
                  className={`p-1.5 rounded-full transition hover:bg-blue-100 text-blue-600 dark:hover:bg-dark-hover dark:text-blue-200`}
                  aria-label={`${isExperimentalOpen ? 'Collapse' : 'Expand'} Experimental`}
                  onClick={() => setIsExperimentalOpen((prev) => !prev)}
                >
                  {isExperimentalOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
              </div>
            </div>
            {isExperimentalOpen && (!isMobile && collapsed ? false : true) && (
              <ul className="ml-2 mt-1 space-y-1">
                {userDetails?.isEnrolledInExperimental ? (
                  <li key="automation">
                    <button
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${router.pathname === '/experimental/automation'
                        ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/60 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-dark-hover dark:text-blue-200 ml-2'}`}
                      onClick={() => handleNavigation('/experimental/automation')}
                      title="Automation"
                    >
                      <span className="flex items-center gap-2 w-full">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-650 dark:text-purple-300">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                        <span className="truncate text-sm font-medium">Automation</span>
                      </span>
                    </button>
                  </li>
                ) : (
                  <li key="enroll" className="px-2 py-1.5">
                    <button
                      onClick={handleEnrollExperimental}
                      disabled={isEnrolling}
                      className="w-full text-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-600/10 transition-all duration-200 disabled:opacity-50"
                    >
                      {isEnrolling ? 'Enrolling...' : 'Enroll'}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </nav>

        {/* Bottom: Logout & Theme Switch */}
        <div className={`flex flex-col gap-1.5 p-4 border-t border-gray-200 dark:border-dark-border bg-transparent`}>
          {/* Upgrade to Premium Button - Only show for admin users without premium */}
          {userDetails?.role === 'Admin' && !userDetails?.isPremiumMember && (!isMobile && !collapsed) && (
            <button onClick={() => handleNavigation('/settings?tab=billing')}
              className={`w-full flex items-center ${(!isMobile && collapsed) ? 'justify-center gap-2' : 'justify-between gap-3'} px-3 py-2 rounded-xl font-medium transition-all duration-200 border bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-dark-bg dark:border-dark-border dark:text-white dark:hover:bg-dark-hover`} >
              <div className="flex items-center gap-2">
                <span className={`text-sm text-gray-700 dark:text-gray-300`}>Upgrade to</span>
                <span className="px-2 py-1 rounded-md bg-black text-white text-xs font-semibold tracking-wide">PRO</span>
              </div>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-white text-gray-600 dark:bg-[#1a1a1a] dark:text-gray-200 border border-gray-200 dark:border-[#2e2e2e]`}>
                <FaArrowRight size={12} className='-rotate-45 hover:transform hover:-rotate-90 transition-all duration-200' />
              </div>
            </button>
          )}

          <SidebarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
                <rect x="4" y="8" width="16" height="12" rx="3" />
                <path d="M12 8V5M9 3h6M9 14h.01M15 14h.01" />
              </svg>
            }
            label="AI Assistant"
            onClick={() => setIsChatBotOpen(!isChatBotOpen)}
            theme={theme}
            isMobile={isMobile}
            collapsed={collapsed}
          />
          <SidebarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            }
            label="Settings"
            onClick={async () => {
              router.push('/settings');
            }}
            theme={theme}
            isMobile={isMobile}
            collapsed={collapsed}
          />
          <SidebarButton
            icon={
              theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-blue-300">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )
            }
            label="Dark Mode"
            onClick={toggleTheme}
            theme={theme}
            isMobile={isMobile}
            collapsed={collapsed}
          />
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            className={`absolute top-4 right-4 z-50 p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800`}
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

export default Sidebar;