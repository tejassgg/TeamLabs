import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api, { authService } from '../../services/api';
import Layout from '../../components/Layout';
import { FaUser, FaEnvelope, FaIdCard, FaEdit } from 'react-icons/fa';
import { useTeams } from '../../context/TeamContext';

const TeamDetailsPage = () => {
  const router = useRouter();
  const { teamId } = router.query;
  const { updateTeam, fetchTeams } = useTeams();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgUsers, setOrgUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    api.get(`/team-details/${teamId}`)
      .then(res => {
        setTeam(res.data.team);
        setMembers(res.data.members);
        setOrgUsers(res.data.orgUsers);
        setError('');
      })
      .catch(() => setError('Failed to load team details'))
      .finally(() => setLoading(false));
  }, [teamId]);

  const isOwner = currentUser && team && currentUser._id === team.OwnerID;

  // Filter users as search changes
  useEffect(() => {
    if (!search) {
      setFilteredUsers([]);
      return;
    }
    const s = search.toLowerCase();
    // Exclude users who are already members
    const memberIds = new Set(members.map(m => m.MemberID));
    setFilteredUsers(
      orgUsers.filter(u =>
        !memberIds.has(u._id) && (
          (u.firstName && u.firstName.toLowerCase().includes(s)) ||
          (u.lastName && u.lastName.toLowerCase().includes(s)) ||
          (u.email && u.email.toLowerCase().includes(s)) ||
          (u.username && u.username.toLowerCase().includes(s)) ||
          (u._id && u._id.toLowerCase().includes(s))
        )
      )
    );
  }, [search, orgUsers, members]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user to add');
      return;
    }
    setAdding(true);
    setError('');
    try {
      await api.post(`/team-details/${teamId}/add-member`, {
        UserID: selectedUser._id,
        OwnerID: team.OwnerID
      });
      setSearch('');
      setSelectedUser(null);
      setFilteredUsers([]);
      // Refresh members
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleStatus = async (memberId) => {
    setToggling(memberId);
    setError('');
    try {
      await api.patch(`/team-details/${teamId}/member/${memberId}/toggle`, {OwnerID: team.OwnerID});
      // Refresh members
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update status');
    } finally {
      setToggling('');
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    
    setRenaming(true);
    setError('');
    try {
      await api.patch(`/team-details/${teamId}`, {
        TeamName: newTeamName.trim(),
        OwnerID: team.OwnerID
      });
      
      // Update local state
      setTeam(prev => ({ ...prev, TeamName: newTeamName.trim() }));
      
      setIsEditing(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to rename team');
    } finally {
      setRenaming(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              {isEditing ? (
                <form onSubmit={handleRename} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="text-3xl font-bold border rounded px-2 py-1"
                    placeholder="Enter new team name"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={renaming || !newTeamName.trim()}
                  >
                    {renaming ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setNewTeamName('');
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <h1 className="text-3xl font-bold">{team.TeamName}</h1>
                  {isOwner && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setNewTeamName(team.TeamName);
                      }}
                      className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100 transition-colors"
                      title="Rename team"
                    >
                      <FaEdit size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="mb-4 text-gray-600">{team.TeamDescription}</p>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Team Members</h2>
              <table className="w-full border rounded">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left w-[250px]">Member ID</th>
                    <th className="py-2 px-4 text-left w-[250px]">Name</th>
                    <th className="py-2 px-4 text-left w-[300px]">Email</th>
                    <th className="py-2 px-4 text-left w-[120px]">Status</th>
                    {isOwner && <th className="py-2 px-4 w-[180px]">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.TeamDetailsID} className="border-t">
                      <td className="py-2 px-4 font-mono text-sm">{member.MemberID}</td>
                      <td className="py-2 px-4 font-medium">{member.name}</td>
                      <td className="py-2 px-4">{member.email}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${member.IsMemberActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {member.IsMemberActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="py-2 px-4">
                          <button
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                              member.IsMemberActive 
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            } ${toggling === member.MemberID ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => handleToggleStatus(member.MemberID)}
                            disabled={toggling === member.MemberID}
                          >
                            {toggling === member.MemberID ? (
                              'Updating...'
                            ) : member.IsMemberActive ? (
                              'Deactivate Member'
                            ) : (
                              'Activate Member'
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr><td colSpan={isOwner ? 5 : 4} className="text-center py-4 text-gray-400">No members</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {isOwner && (
              <form onSubmit={handleAddMember} className="mb-4 flex flex-col gap-2 items-start">
                <label className="block text-gray-700 font-semibold mb-1">Add Member (search by name, email, or UserID)</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full md:w-96"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="Type to search..."
                  autoComplete="off"
                />
                {search && filteredUsers.length > 0 && (
                  <ul className="border rounded-lg bg-white w-full md:w-96 max-h-48 overflow-y-auto z-10 shadow-md">
                    {filteredUsers.map((user, index) => (
                      <li
                        key={`${user._id}-${index}`}
                        className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 border-b last:border-b-0 transition-colors duration-150 ${selectedUser && selectedUser._id === user._id ? 'bg-blue-100' : ''}`}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearch(user.firstName + ' ' + user.lastName + ' (' + user.email + ')');
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            ID: {user._id}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-2"
                  disabled={adding}
                >
                  {adding ? 'Adding...' : 'Add Member'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default TeamDetailsPage; 