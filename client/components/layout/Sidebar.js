import { useGlobal } from '../../context/GlobalContext';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';

const Sidebar = ({ collapsed, setCollapsed, sidebarTeam, setSidebarTeam }) => {
  const { teams } = useGlobal();

  return (
    <div className={`h-screen ${theme === 'dark' ? 'bg-[#18181b] border-gray-700' : 'bg-white border-gray-200'} border-r shadow-sm ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      {/* Teams Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold text-gray-800 dark:text-white ${collapsed ? 'hidden' : ''}`}>Teams</h2>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        <div className="space-y-2">
          {teams.map(team => (
            <div
              key={team._id}
              className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                sidebarTeam?._id === team._id ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              onClick={() => setSidebarTeam(team)}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: team.TeamColor }}>
                {team.TeamName[0]}
              </div>
              {!collapsed && (
                <span className="ml-3 text-gray-700 dark:text-gray-300">{team.TeamName}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 