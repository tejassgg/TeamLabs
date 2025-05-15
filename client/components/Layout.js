import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaChevronRight, FaFolder, FaBookOpen, FaTasks, FaUsers, FaHome, FaChevronDown } from 'react-icons/fa';
import { useRouter } from 'next/router';
import AddTeamModal from './AddTeamModal';
import { teamService } from '../services/api';
import { projectService } from '../services/api';
import AddProjectModal from './AddProjectModal';
import { useGlobal } from '../context/GlobalContext';
import AddTaskModal from './AddTaskModal';
import { taskService } from '../services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

const Sidebar = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isTeamsCollapsed, setIsTeamsCollapsed] = useState(false);
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const { teams, projects, tasksDetails, organizations, loading, userDetails, setProjects, setTeams, setTasksDetails } = useGlobal();

  const canManageTeamsAndProjects = userDetails?.role === 'Admin' || userDetails?.role === 'Owner';
  // Mock data for demonstration
  const userStories = [
    { id: 1, name: 'User can register an account' },
    { id: 2, name: 'User can reset password' },
    { id: 3, name: 'Admin can manage users' },
    { id: 4, name: 'User can create a project' },
    { id: 5, name: 'User can create a user story' },
    { id: 6, name: 'User can create a task' }
  ];

  const activeTeamId = router.pathname.startsWith('/team/') ? router.query.teamId : null;

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

  const handleAddTask = async (taskData) => {
    try {
      const newTask = await taskService.addTaskDetails(taskData, 'fromSideBar');
      setTasksDetails(prevTasks => [...prevTasks, newTask]);
      toast.success('Task added successfully!');
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 w-78 ${theme === 'dark' ? 'bg-[#232E3C] text-[#F3F6FA]' : 'bg-gray-200 text-gray-900'} p-4 flex flex-col`}
        style={{ minHeight: '100vh', width: 300 }}
      >
        {/* Organization Cover Section */}
        <div className="relative mb-6" style={{ minHeight: '180px' }}>
          <img
            src="/static/default-org-cover.jpeg"
            alt="Organization Cover"
            className="absolute top-0 left-0 w-full h-full object-cover rounded-xl"
            style={{ zIndex: 0 }}
            onError={e => { e.target.onerror = null; e.target.src = '/static/default-org-cover.jpeg'; }}
          />
          <div className="absolute left-0 top-0 w-full h-full flex flex-col items-center justify-center" style={{ zIndex: 1 }}>
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600 border-4 border-white shadow-lg mb-2 mt-2">
              {organizations[0]?.name?.split(' ').map(n => n[0]).join('') || 'OG'}
            </div>
            {!loading && organizations.length > 1 ? (
              <select
                className="bg-white bg-opacity-90 text-gray-900 font-semibold rounded-xl px-3 py-2 focus:outline-none shadow-sm border border-gray-200"
                value={userDetails?.organizationID || ''}
                onChange={e => {
                  // Handle organization change if needed
                  console.log('Organization changed to:', e.target.value);
                }}
                style={{ maxWidth: '80%' }}
              >
                {organizations.map(org => (
                  <option key={org._id} value={org._id}>{org.name}</option>
                ))}
                <option value="add">+ Add an Organization</option>
              </select>
            ) : (
              <div className="bg-white bg-opacity-90 text-gray-900 font-semibold rounded-xl px-3 py-2 shadow-sm border border-gray-200" style={{ maxWidth: '80%' }}>
                {organizations[0]?.name || 'No Organization'}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col p-4">
          <div className="space-y-6">
            {/* Dashboard Button */}
            <div>
              <button
                className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-gray-50 rounded-xl transition cursor-pointer w-full"
                style={{ minHeight: 32 }}
                onClick={() => router.push('/dashboard')}
                tabIndex={0}
                aria-label="Go to Dashboard"
              >
                <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-gray-100 group-hover:shadow-sm" style={{ width: 28, height: 28 }}>
                  <FaHome className="text-blue-600" size={20} />
                </span>
                <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">Dashboard</h3>
              </button>
            </div>

            {/* Teams Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                  style={{ minHeight: 32 }}
                  onClick={() => setIsTeamsCollapsed(!isTeamsCollapsed)}
                  tabIndex={0}
                  aria-label="Toggle Teams Section"
                >
                  <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-gray-100 group-hover:shadow-sm" style={{ width: 28, height: 28 }}>
                    <FaUsers className="text-blue-600" size={20} />
                  </span>
                  <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">Teams</h3>
                  {isTeamsCollapsed ? <FaChevronRight size={12} /> : <FaChevronDown size={12} />}
                </button>
                {canManageTeamsAndProjects ? (
                  <button
                    className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition text-xs cursor-pointer ml-2"
                    aria-label="Add Team"
                    onClick={() => setIsAddTeamOpen(true)}
                  >
                    <FaPlus size={12} />
                  </button>
                ) : (
                  <div className="relative group">
                    <button
                      className="p-1.5 rounded-full text-gray-400 cursor-not-allowed ml-2"
                      aria-label="Add Team (Restricted)"
                      disabled
                    >
                      <FaPlus size={12} />
                    </button>
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      Only Admin/Owner can create teams
                      <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
              {!isTeamsCollapsed && (
                <>
                  {teams.length === 0 ? (
                    <div className="pl-2 py-1 text-gray-400 italic">No Teams</div>
                  ) : (
                    <ul className="space-y-1">
                      {teams.map((team) => {
                        const isActive = activeTeamId === (team.TeamID || team._id);
                        return (
                          <li
                            key={team.TeamID || team._id}
                            className={`pl-2 py-1.5 rounded-xl cursor-pointer transition ${isActive
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            onClick={() => router.push(`/team/${team.TeamID || team._id}`)}
                          >
                            {team.TeamName}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                  style={{ minHeight: 32 }}
                  onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
                  tabIndex={0}
                  aria-label="Toggle Projects Section"
                >
                  <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-gray-100 group-hover:shadow-sm" style={{ width: 28, height: 28 }}>
                    <FaFolder className="text-blue-600" size={20} />
                  </span>
                  <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">Projects</h3>
                  {isProjectsCollapsed ? <FaChevronRight size={12} /> : <FaChevronDown size={12} />}
                </button>
                {canManageTeamsAndProjects ? (
                  <button
                    className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition text-xs cursor-pointer ml-2"
                    aria-label="Add Project"
                    onClick={() => setIsAddProjectOpen(true)}
                  >
                    <FaPlus size={12} />
                  </button>
                ) : (
                  <div className="relative group">
                    <button
                      className="p-1.5 rounded-full text-gray-400 cursor-not-allowed ml-2"
                      aria-label="Add Project (Restricted)"
                      disabled
                    >
                      <FaPlus size={12} />
                    </button>
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      Only Admin/Owner can create projects
                      <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
              {!isProjectsCollapsed && (
                <>
                  {projects.length === 0 ? (
                    <div className="pl-2 py-1 text-gray-400 italic">No Projects</div>
                  ) : (
                    <ul className="space-y-1">
                      {projects.map(project => (
                        <li
                          key={project.ProjectID || project._id}
                          className="pl-2 py-1.5 rounded-xl hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition"
                          onClick={() => router.push(`/project/${project.ProjectID || project._id}`)}
                        >
                          {project.Name}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
            {/* User Stories Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                  style={{ minHeight: 32 }}
                  onClick={() => router.push('/userstories')}
                  tabIndex={0}
                  aria-label="Go to UserStories"
                >
                  <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-gray-100 group-hover:shadow-sm" style={{ width: 28, height: 28 }}>
                    <FaBookOpen className="text-blue-600" size={20} />
                  </span>
                  <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">UserStories</h3>
                </button>
                <button
                  className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition text-xs cursor-pointer ml-2"
                  aria-label="Add User Story"
                  onClick={() => setIsAddTaskOpen(true)}
                >
                  <FaPlus size={12} />
                </button>
              </div>
              {/* List of user stories from tasksDetails */}
              <ul className="space-y-1 mt-2">
                {tasksDetails.filter(task => task.Type === 'User Story').length === 0 ? (
                  <li className="pl-2 py-1.5 text-gray-400">No user stories</li>
                ) : (
                  tasksDetails.filter(task => task.Type === 'User Story').map(task => (
                    <li key={task._id} className="pl-2 py-1.5 rounded-xl hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition">
                      {task.Name}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
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
            onAddTask={handleAddTask}
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
  const sidebarWidth = 300;
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#181F2A] text-[#F3F6FA]' : 'bg-white text-gray-900'}`}>
      <Sidebar />
      <div style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s' }}>
        <div className="flex justify-center">
          <div style={{ width: '98%' }}>
            <Navbar theme={theme} toggleTheme={toggleTheme} onLogout={logout} />
          </div>
        </div>
        <main className={`p-8 overflow-y-auto min-h-[calc(100vh-80px)] ${theme === 'dark' ? 'bg-[#181F2A] text-[#F3F6FA]' : ''}`}>{children}</main>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </div>
  );
};

export default Layout; 