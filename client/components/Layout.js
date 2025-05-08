import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaChevronLeft, FaChevronRight, FaFolder, FaBookOpen, FaTasks } from 'react-icons/fa';
import { useRouter } from 'next/router';

const Sidebar = ({ sidebarTeam, setSidebarOrg, collapsed, setCollapsed }) => {
  const { theme } = useTheme();
  const router = useRouter();
  // Mock data for demonstration
  const projects = [
    { id: 1, name: 'Website Redesign' },
    { id: 2, name: 'Mobile App Launch' },
    { id: 3, name: 'API Integration' },
  ];
  const userStories = [
    { id: 1, name: 'User can register an account' },
    { id: 2, name: 'User can reset password' },
    { id: 3, name: 'Admin can manage users' },
    { id: 4, name: 'User can create a project' },
    { id: 5, name: 'User can create a user story' },
    { id: 6, name: 'User can create a task' }
  ];
  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-78'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} p-4 flex flex-col`}
      style={{ minHeight: '100vh' }}
    >
      <button
        className={`mb-6 p-2 rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'} hover:bg-primary hover:text-white transition cursor-pointer`}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '→' : '←'}
      </button>
      {/* Organization Cover Section - moved above padding */}
      {!collapsed && (
        <div className="relative" style={{ minHeight: '180px' }}>
          <img
            src="/static/default-org-cover.jpeg"
            alt="Organization Cover"
            className="absolute top-0 left-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
            onError={e => { e.target.onerror = null; e.target.src = '/static/default-org-cover.jpeg'; }}
          />
          <div className="absolute left-0 top-0 w-full h-full flex flex-col items-center justify-center" style={{ zIndex: 1 }}>
            <div className="w-14 h-14 rounded-full bg-gray-400 flex items-center justify-center text-lg font-bold text-white border-4 border-white shadow-lg mb-2 mt-2">OG</div>
            <select
              className="bg-white bg-opacity-80 text-black font-semibold rounded px-2 py-1 focus:outline-none shadow"
              value={sidebarTeam}
              onChange={e => setSidebarOrg(e.target.value)}
              style={{ maxWidth: '80%' }}
            >
              <option>Olanthroxx Org</option>
              <option>+ Add an Organization</option>
            </select>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col p-4">
        {/* Sidebar Lists - always show icons and plus, only show text/lists when expanded */}
        <div className="space-y-6">
          {/* Projects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-white/60 rounded transition cursor-pointer"
                style={{ minHeight: 32 }}
                onClick={() => router.push('/projects')}
                tabIndex={0}
                aria-label="Go to Projects"
              >
                <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-white group-hover:shadow-md" style={{ width: 28, height: 28 }}>
                  <FaFolder className="text-primary" size={20} />
                </span>
                {!collapsed && (
                  <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">Projects</h3>
                )}
              </button>
              <button
                className="p-1 rounded hover:bg-primary hover:text-white transition text-xs cursor-pointer ml-2"
                aria-label="Add Project"
                onClick={() => alert('Add new Project (modal coming soon!)')}
              >
                <FaPlus size={12} />
              </button>
            </div>
            {!collapsed && (
              <ul className="space-y-1">
                {projects.map(project => (
                  <li key={project.id} className="pl-2 py-1 rounded hover:bg-primary hover:text-white cursor-pointer transition">
                    {project.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* User Stories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-white/60 rounded transition cursor-pointer"
                style={{ minHeight: 32 }}
                onClick={() => router.push('/userstories')}
                tabIndex={0}
                aria-label="Go to UserStories"
              >
                <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-white group-hover:shadow-md" style={{ width: 28, height: 28 }}>
                  <FaBookOpen className="text-primary" size={20} />
                </span>
                {!collapsed && (
                  <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">UserStories</h3>
                )}
              </button>
              <button
                className="p-1 rounded hover:bg-primary hover:text-white transition text-xs cursor-pointer ml-2"
                aria-label="Add User Story"
                onClick={() => alert('Add new User Story (modal coming soon!)')}
              >
                <FaPlus size={12} />
              </button>
            </div>
            {!collapsed && (
              <ul className="space-y-1">
                {userStories.map(story => (
                  <li key={story.id} className="pl-2 py-1 rounded hover:bg-primary hover:text-white cursor-pointer transition">
                    {story.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Tasks (placeholder) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                className="flex items-center gap-2 group focus:outline-none bg-transparent border-0 p-0 m-0 hover:bg-white/60 rounded transition cursor-pointer"
                style={{ minHeight: 32 }}
                onClick={() => router.push('/tasks')}
                tabIndex={0}
                aria-label="Go to Tasks"
              >
                <span className="flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-white group-hover:shadow-md" style={{ width: 28, height: 28 }}>
                  <FaTasks className="text-primary" size={20} />
                </span>
                {!collapsed && (
                  <h3 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">Tasks</h3>
                )}
              </button>
              <button
                className="p-1 rounded hover:bg-primary hover:text-white transition text-xs cursor-pointer ml-2"
                aria-label="Add Task"
                onClick={() => alert('Add new Task (modal coming soon!)')}
              >
                <FaPlus size={12} />
              </button>
            </div>
            {!collapsed && (
              <ul className="space-y-1">
                <li className="pl-2 py-1 text-gray-400">No tasks listed</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [sidebarTeam, setSidebarOrg] = useState('Olanthroxx Org');
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 80 : 300; // px
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <Sidebar sidebarTeam={sidebarTeam} setSidebarOrg={setSidebarOrg} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s' }}>
        <div className="flex justify-center">
          <div style={{ width: '98%' }}>
            <Navbar theme={theme} toggleTheme={toggleTheme} onLogout={logout} />
          </div>
        </div>
        <main className="p-8 overflow-y-auto min-h-[calc(100vh-80px)]">{children}</main>
      </div>
    </div>
  );
};

export default Layout; 