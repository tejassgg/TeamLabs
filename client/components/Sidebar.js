import { useTeams } from '../context/TeamContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Sidebar = () => {
  const { teams, loading } = useTeams();
  const router = useRouter();

  useEffect(() => {
    console.log('Sidebar teams:', teams);
  }, [teams]);

  return (
    <div className="...">
      {/* ... other sidebar content ... */}
      
      <div className="mt-4">
        <h3 className="px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Teams
        </h3>
        <div className="mt-2 space-y-1">
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No teams found</div>
          ) : (
            teams.map(team => {
              console.log('Rendering team:', team);
              return (
                <Link
                  key={team.TeamID}
                  href={`/team/${team.TeamID}`}
                  className={`flex items-center px-4 py-2 text-sm ${
                    router.asPath === `/team/${team.TeamID}`
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="truncate">{team.TeamName}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
      
      {/* ... other sidebar content ... */}
    </div>
  );
};

export default Sidebar; 