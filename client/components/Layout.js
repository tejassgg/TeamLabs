import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaChevronLeft, FaChevronRight, FaFolder, FaBookOpen, FaTasks, FaUsers } from 'react-icons/fa';
import { useRouter } from 'next/router';
import AddTeamModal from './AddTeamModal';
import { teamService } from '../services/api';
import { authService } from '../services/api';
import { projectService } from '../services/api';
import AddProjectModal from './AddProjectModal';

const Sidebar = ({ sidebarTeam, setSidebarOrg }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userOrgId, setUserOrgId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [userId, setUserId] = useState(null);
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

  useEffect(() => {
    // Fetch user profile to get organization ID
    authService.getUserProfile()
      .then(profile => {
        setUserOrgId(profile.organizationID);
        setUserId(profile._id);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
      });

    // Fetch teams from backend on mount
    teamService.getTeams()
      .then(fetchedTeams => {
        // Filter teams based on user's organization ID
        const filteredTeams = fetchedTeams.filter(team => team.organizationID === userOrgId);
        setTeams(filteredTeams);
      })
      .catch(() => setTeams([]));
    
    // Fetch user organizations
    authService.getUserOrganizations()
      .then(orgs => {
        setOrganizations(orgs);
        setLoading(false);
      })
      .catch(() => {
        setOrganizations([]);
        setLoading(false);
      });

    // Fetch projects allocated to the user
    projectService.getProjects(userId)
      .then(fetchedProjects => {
        console.log(fetchedProjects);
        setProjects(fetchedProjects);
      })
      .catch(() => {
        setProjects([]);
      });
  }, [userOrgId]); // Add userOrgId as dependency

  const handleAddTeam = async (teamData) => {
    try {
      const newTeam = await teamService.addTeam(teamData);
      setTeams(prev => [...prev, newTeam]);
    } catch (err) {
      alert('Failed to add team');
    }
  };

  const handleAddProject = async (projectData) => {
    try {
      projectData.OrganizationID = userOrgId;
      projectData.ProjectOwner = userId;
      const newProject = await projectService.addProject(projectData);
      setProjects(prev => [...prev, newProject]);
    } catch (err) {
      alert('Failed to add project');
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
                value={sidebarTeam}
                onChange={e => setSidebarOrg(e.target.value)}
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
            {/* Teams Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                  style={{ minHeight: 32 }}
                  tabIndex={0}
                  aria-label="Go to Teams"
                >
                  <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-gray-100 group-hover:shadow-sm" style={{ width: 28, height: 28 }}>
                    <FaUsers className="text-blue-600" size={20} />
                  </span>
                  <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">Teams</h3>
                </button>
                <button
                  className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition text-xs cursor-pointer ml-2"
                  aria-label="Add Team"
                  onClick={() => setIsAddTeamOpen(true)}
                >
                  <FaPlus size={12} />
                </button>
              </div>
              {teams.length === 0 ? (
                <div className="pl-2 py-1 text-gray-400 italic">No Teams</div>
              ) : (
                <ul className="space-y-1">
                  {teams.map((team) => {
                    const isActive = activeTeamId === (team.TeamID || team._id);
                    return (
                      <li
                        key={team.TeamID || team._id}
                        className={`pl-2 py-1.5 rounded-xl cursor-pointer transition ${
                          isActive
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
            </div>
            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                  style={{ minHeight: 32 }}
                  onClick={() => router.push('/projects')}
                  tabIndex={0}
                  aria-label="Go to Projects"
                >
                  <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-gray-100 group-hover:shadow-sm" style={{ width: 28, height: 28 }}>
                    <FaFolder className="text-blue-600" size={20} />
                  </span>
                  <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">Projects</h3>
                </button>
                <button
                  className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition text-xs cursor-pointer ml-2"
                  aria-label="Add Project"
                  onClick={() => setIsAddProjectOpen(true)}
                >
                  <FaPlus size={12} />
                </button>
              </div>
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
              <AddProjectModal
                isOpen={isAddProjectOpen}
                onClose={() => setIsAddProjectOpen(false)}
                onAddProject={handleAddProject}
              />
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
                  onClick={() => alert('Add new User Story (modal coming soon!)')}
                >
                  <FaPlus size={12} />
                </button>
              </div>
              <ul className="space-y-1">
                {userStories.map(story => (
                  <li key={story.id} className="pl-2 py-1.5 rounded-xl hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition">
                    {story.name}
                  </li>
                ))}
              </ul>
            </div>
            {/* Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                  style={{ minHeight: 32 }}
                  onClick={() => router.push('/tasks')}
                  tabIndex={0}
                  aria-label="Go to Tasks"
                >
                  <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-gray-100 group-hover:shadow-sm" style={{ width: 28, height: 28 }}>
                    <FaTasks className="text-blue-600" size={20} />
                  </span>
                  <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">Tasks</h3>
                </button>
                <button
                  className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition text-xs cursor-pointer ml-2"
                  aria-label="Add Task"
                  onClick={() => alert('Add new Task (modal coming soon!)')}
                >
                  <FaPlus size={12} />
                </button>
              </div>
              <ul className="space-y-1">
                <li className="pl-2 py-1.5 text-gray-400">No tasks listed</li>
              </ul>
            </div>
          </div>
        </div>
      </aside>
      <AddTeamModal
        isOpen={isAddTeamOpen}
        onClose={() => setIsAddTeamOpen(false)}
        onAddTeam={handleAddTeam}
      />
    </>
  );
};

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [sidebarOrg, setSidebarOrg] = useState('Olanthroxx Org');
  const sidebarWidth = 300;
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#181F2A] text-[#F3F6FA]' : 'bg-white text-gray-900'}`}>
      <Sidebar sidebarOrg={sidebarOrg} setSidebarOrg={setSidebarOrg} />
      <div style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s' }}>
        <div className="flex justify-center">
          <div style={{ width: '98%' }}>
            <Navbar theme={theme} toggleTheme={toggleTheme} onLogout={logout} />
          </div>
        </div>
        <main className={`p-8 overflow-y-auto min-h-[calc(100vh-80px)] ${theme === 'dark' ? 'bg-[#181F2A] text-[#F3F6FA]' : ''}`}>{children}</main>
      </div>
    </div>
  );
};

export default Layout; 