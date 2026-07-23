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
import useSWR from 'swr';

const TeamsPage = () => {
  const { setTeams, userDetails } = useGlobal();
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamsWithStats, setTeamsWithStats] = useState([]);

  const canManageTeams = userDetails?.role === 'Admin' || userDetails?.role === 'Owner';

  // SWR-based teams overview query
  const { data: SWRTeamsData, error: SWRTeamsError, mutate } = useSWR(
    userDetails?._id ? `/teams/overview/${userDetails._id}` : null,
    () => teamService.getTeamsOverview(userDetails._id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  );

  const loading = !SWRTeamsData && !SWRTeamsError;

  // Sync SWRTeamsData with teamsWithStats local state
  useEffect(() => {
    if (SWRTeamsData) {
      setTeamsWithStats(SWRTeamsData);
    }
  }, [SWRTeamsData]);

  // Filter teams based on search term
  const filteredTeams = teamsWithStats.filter(team =>
    team.TeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.TeamDescription && team.TeamDescription.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTeam = async (teamData) => {
    try {
      const newTeam = await teamService.addTeam(teamData);
      setTeams(prevTeams => [...prevTeams, newTeam.team]);
      showToast('Team added successfully!', 'success', 5000, {
        description: `Team "${newTeam?.team?.TeamName || teamData?.TeamName || ''}" has been created.`,
        action: {
          label: 'View',
          onClick: () => router.push(`/team/${newTeam?.team?.TeamID}`)
        }
      });
      // Refresh teams overview cache
      mutate();
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
    mutate();
  };

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
    <div className="mx-auto bg-white dark:bg-dark-bg text-gray-900 dark:text-white p-4">
      {/* Page Header */}
      <div className="mb-4">
        {/* Search Bar */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-2xl">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-card text-gray-900 dark:text-white"
            />
          </div>
          {canManageTeams && (
            <button
              onClick={() => setIsAddTeamOpen(true)}
              className={'flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'}
            >
              <FaPlus size={16} />
              New
            </button>
          )}
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-bg">
          <FaUsers className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No teams found' : 'No teams yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
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
