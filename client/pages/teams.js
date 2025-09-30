import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { teamService } from '../services/api';
import { FaPlus, FaSearch, FaUsers } from 'react-icons/fa';
import AddTeamModal from '../components/team/AddTeamModal';
import TeamCard from '../components/team/TeamCard';
import TeamsSkeleton from '../components/skeletons/TeamsSkeleton';
import { useToast } from '../context/ToastContext';

const TeamsPage = () => {
  const { setTeams, userDetails, getThemeClasses } = useGlobal();
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [teamsWithStats, setTeamsWithStats] = useState([]);

  const canManageTeams = userDetails?.role === 'Admin' || userDetails?.role === 'Owner';

  // Fetch teams with statistics using the new API
  const fetchTeamsWithStats = async (showLoading = true) => {
    if (!userDetails?._id) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      const teamsData = await teamService.getTeamsOverview(userDetails._id);
      setTeamsWithStats(teamsData);
    } catch (error) {
      console.error('Error fetching teams overview:', error);
      showToast('Failed to load teams', 'error');
      setTeamsWithStats([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Filter teams based on search term
  const filteredTeams = teamsWithStats.filter(team =>
    team.TeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.TeamDescription && team.TeamDescription.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTeam = async (teamData) => {
    try {
      const newTeam = await teamService.addTeam(teamData);
      setTeams(prevTeams => [...prevTeams, newTeam.team]);
      showToast('Team added successfully!', 'success');
      // Refresh teams with stats after adding new team (without showing loading)
      await fetchTeamsWithStats(false);
      return newTeam;
    } catch (err) {
      if (err.status == 403) {
        showToast(err.message, 'warning');
      } else {
        showToast('Failed to add team', 'error');
      }
    }
  };

  const handleRequestSent = async (teamId) => {
    // Refresh teams to update the request status
    await fetchTeamsWithStats(false);
  };


  useEffect(() => {
    if (userDetails?._id) {
      fetchTeamsWithStats();
    }
  }, [userDetails?._id]);

  // Auto-open Add Team modal if query param addTeam=1 is present
  useEffect(() => {
    if (!router || !router.isReady) return;
    const shouldOpen = router.query?.addTeam === '1';
    if (shouldOpen) {
      setIsAddTeamOpen(true);
      // Clean the URL without reloading the page
      const { pathname, query } = router;
      if (query.addTeam) {
        const newQuery = { ...query };
        delete newQuery.addTeam;
        router.replace({ pathname, query: newQuery }, undefined, { shallow: true });
      }
    }
  }, [router, router.isReady, router.query]);

  if (loading && teamsWithStats.length === 0) {
    return <TeamsSkeleton />;
  }

  return (
    <div className={getThemeClasses(
      'mx-auto bg-white text-gray-900',
      'mx-auto bg-[#18181b] text-white'
    )}>
      {/* Page Header */}
      <div className="mb-4">
        {/* Search Bar */}
        <div className="flex items-center justify-between mt-4">
          <div className="relative max-w-2xl">
            <FaSearch className={getThemeClasses(
              'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
              'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'
            )} size={16} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={getThemeClasses(
                'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900',
                'w-full pl-10 pr-4 py-2 border border-gray-600 bg-[#232323] text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          </div>
          {canManageTeams && (
            <button
              onClick={() => setIsAddTeamOpen(true)}
              className={getThemeClasses(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm',
                'dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'
              )}
            >
              <FaPlus size={16} />
              New
            </button>
          )}
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className={getThemeClasses(
          'text-center py-12 bg-white',
          'text-center py-12 bg-[#18181b]'
        )}>
          <FaUsers className={getThemeClasses(
            'mx-auto text-gray-400 mb-4',
            'mx-auto text-gray-500 mb-4'
          )} size={48} />
          <h3 className={getThemeClasses(
            'text-lg font-medium text-gray-900 mb-2',
            'text-lg font-medium text-white mb-2'
          )}>
            {searchTerm ? 'No teams found' : 'No teams yet'}
          </h3>
          <p className={getThemeClasses(
            'text-gray-600 mb-6',
            'text-gray-400 mb-6'
          )}>
            {searchTerm
              ? 'Try adjusting your search terms'
              : canManageTeams
                ? 'Create your first team to get started'
                : 'You are not a member of any teams yet'
            }
          </p>
          {canManageTeams && !searchTerm && (
            <button
              onClick={() => setIsAddTeamOpen(true)}
              className={getThemeClasses(
                'flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto',
                'flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto'
              )}
            >
              <FaPlus size={16} />
              Create Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.TeamID || team._id}
              team={team}
              theme={theme}
              onRequestSent={handleRequestSent}
            />
          ))}
        </div>
      )}

      {/* Add Team Modal */}
      {canManageTeams && (
        <AddTeamModal
          isOpen={isAddTeamOpen}
          onClose={() => setIsAddTeamOpen(false)}
          onAddTeam={handleAddTeam}
          organizationId={userDetails?.organizationID}
          teamOwner={userDetails?._id}
        />
      )}
    </div>
  );
};

export default TeamsPage;
