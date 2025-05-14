import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api, { authService } from '../../services/api';
import Layout from '../../components/Layout';
import { FaCog, FaTrash, FaTimes } from 'react-icons/fa';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';

const TeamDetailsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { teamId } = router.query;
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgUsers, setOrgUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    TeamName: '',
    TeamDescription: '',
    TeamType: '',
    TeamColor: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [teamTypes, setTeamTypes] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [togglingTeam, setTogglingTeam] = useState('');
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removing, setRemoving] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [userToAdd, setUserToAdd] = useState(null);
  const [showInactiveMemberDialog, setShowInactiveMemberDialog] = useState(false);
  const [selectedInactiveMember, setSelectedInactiveMember] = useState(null);
  const [activeProjects, setActiveProjects] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const { teams, setTeams } = useGlobal();

  const teamColors = [
    { value: '#3B82F6', name: 'Blue' },
    { value: '#10B981', name: 'Green' },
    { value: '#F59E0B', name: 'Amber' },
    { value: '#EF4444', name: 'Red' },
    { value: '#8B5CF6', name: 'Purple' },
    { value: '#EC4899', name: 'Pink' },
    { value: '#6B7280', name: 'Gray' },
  ];

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    if (teamId) {
      api.get(`/team-details/${teamId}`)
        .then(res => {
          setTeam(res.data.team);
          setMembers(res.data.members);
          setOrgUsers(res.data.orgUsers);
          setSettingsForm({
            TeamName: res.data.team.TeamName,
            TeamType: res.data.team.TeamType,
            TeamColor: res.data.team.TeamColor
          });
          // Set active projects from the main response
          setActiveProjects(res.data.activeProjects || []);
        })
        .catch(err => {
          console.error('Error fetching team:', err);
          router.push('/dashboard');
        })
        .finally(() => setLoading(false));
    }
  }, [teamId, router]);

  useEffect(() => {
    // Fetch team types from CommonTypes
    api.get('/common-types/team-types')
      .then(res => {
        setTeamTypes(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch team types:', err);
      });
  }, []);

  const isOwner = currentUser && team && currentUser._id === team.OwnerID;

  // Filter users as search changes
  useEffect(() => {
    if (!isInputFocused) {
      setFilteredUsers([]);
      return;
    }

    if (!search) {
      // When search is empty, show first 10 users by default
      const memberIds = new Set(members.map(m => m.MemberID));
      const availableUsers = orgUsers.filter(u => !memberIds.has(u._id));
      setFilteredUsers(showAllUsers ? availableUsers : availableUsers.slice(0, 10));
      return;
    }

    const s = search.toLowerCase();
    // Exclude users who are already members
    const memberIds = new Set(members.map(m => m.MemberID));
    const matchingUsers = orgUsers.filter(u =>
      !memberIds.has(u._id) && (
        (u.firstName && u.firstName.toLowerCase().includes(s)) ||
        (u.lastName && u.lastName.toLowerCase().includes(s)) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.username && u.username.toLowerCase().includes(s)) ||
        (u._id && u._id.toLowerCase().includes(s))
      )
    );
    setFilteredUsers(showAllUsers ? matchingUsers : matchingUsers.slice(0, 10));
  }, [search, orgUsers, members, showAllUsers, isInputFocused]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!userToAdd) {
      setError('Please select a user to add');
      return;
    }
    setAdding(true);
    setError('');
    try {
      await api.post(`/team-details/${teamId}/add-member`, {
        UserID: userToAdd._id,
        OwnerID: team.OwnerID
      });
      setSearch('');
      setSelectedUser(null);
      setFilteredUsers([]);
      setShowAddMemberDialog(false);
      setUserToAdd(null);
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
      await api.patch(`/team-details/${teamId}/member/${memberId}/toggle`, { OwnerID: team.OwnerID });
      // Refresh members
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
      setShowRevokeDialog(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update status');
    } finally {
      setToggling('');
    }
  };

  const handleToggleTeamStatus = async () => {
    setTogglingTeam(true);
    setError('');
    try {
      await api.patch(`/team-details/${teamId}/toggle-status`, { OwnerID: team.OwnerID });
      // Refresh team data
      const res = await api.get(`/team-details/${teamId}`);
      setTeam(res.data.team);
      setShowConfirmDialog(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update team status');
    } finally {
      setTogglingTeam(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setRemoving(memberId);
    setError('');
    try {
      await api.delete(`/team-details/${teamId}/member/${memberId}`, {
        data: { OwnerID: team.OwnerID }
      });
      // Refresh members
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
      setShowRemoveDialog(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove member');
    } finally {
      setRemoving('');
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setError('');
    try {
      const res = await api.patch(`/team-details/${teamId}`, {
        TeamName: settingsForm.TeamName,
        TeamDescription: settingsForm.TeamDescription,
        TeamType: settingsForm.TeamType,
        TeamColor: settingsForm.TeamColor,
        OwnerID: user?._id
      });

      // Refresh team data
      setTeam(res.data.team);
      setShowSettingsModal(false);
    } catch (err) {
      console.error('Error updating team:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteTeam = async () => {
    setDeletingTeam(true);
    setError('');
    console.table(teams);
    try {
      const res = await api.delete(`/team-details/${teamId}`, {
        data: { OwnerID: user?._id }
      });
      setTeams(teams.filter(t => t.TeamID !== teamId));
      router.push('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete team');
      setShowDeleteDialog(false);
    } finally {
      setDeletingTeam(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8">
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{team.TeamName}</h1>
              </div>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${team.IsActive
                    ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                    : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${team.IsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`}></span>
                    {team.IsActive ? 'Active' : 'InActive'}
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100 transition-colors"
                    title="Team Settings"
                  >
                    <FaCog size={20} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <p className="text-gray-600">{team.TeamDescription}</p>
              {team.teamTypeValue && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-blue-50 text-blue-700 border border-blue-200">
                  {team.teamTypeValue}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Team Members</h2>
              {isOwner && (
                <form onSubmit={handleAddMember} className="mb-4 flex flex-col gap-2">
                  <label className="block text-gray-700 font-semibold mb-1">Search for a Member (search by name, email, or UserID)</label>
                  <input
                    type="text"
                    className="border rounded-xl px-4 py-2.5 w-full md:w-96 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setSelectedUser(null);
                      setShowAllUsers(false);
                    }}
                    onFocus={() => {
                      setIsInputFocused(true);
                      if (!search) {
                        const memberIds = new Set(members.map(m => m.MemberID));
                        const availableUsers = orgUsers.filter(u => !memberIds.has(u._id));
                        setFilteredUsers(availableUsers.slice(0, 10));
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsInputFocused(false);
                      }, 200);
                    }}
                    placeholder="Type to search..."
                    autoComplete="off"
                  />
                  {isInputFocused && filteredUsers.length > 0 && (
                    <div className="w-full md:w-96">
                      <ul className="border rounded-xl bg-white max-h-48 overflow-y-auto z-10 shadow-md">
                        {filteredUsers.map((user, index) => (
                          <li
                            key={`${user._id}-${index}`}
                            className="px-4 py-2.5 border-b last:border-b-0 transition-colors duration-150"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 cursor-pointer hover:bg-blue-50 rounded-lg p-2"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSearch(user.firstName + ' ' + user.lastName + ' (' + user.email + ')');
                                  setIsInputFocused(false);
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
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToAdd(user);
                                  setShowAddMemberDialog(true);
                                }}
                                className="ml-2 px-3 py-1.5 text-sm text-white font-medium rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
                              >
                                Add
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {!showAllUsers && orgUsers.length > 10 && (
                        <button
                          type="button"
                          onClick={() => setShowAllUsers(true)}
                          className="w-full mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-xl transition-colors duration-200"
                        >
                          Show All Users ({orgUsers.length})
                        </button>
                      )}
                    </div>
                  )}
                </form>
              )}
              <table className="w-full border rounded-xl overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left w-[300px]">Member</th>
                    <th className="py-3 px-4 text-left w-[200px]">Date Added</th>
                    <th className="py-3 px-4 text-left w-[200px]">Last Active</th>
                    <th className="py-3 px-4 text-center w-[150px]">Status</th>
                    {isOwner && <th className="py-3 px-4 text-center w-[150px]">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.TeamDetailsID} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-sm text-gray-500">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{new Date(member.CreatedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                      <td className="py-3 px-4">
                        {member.lastLogin ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900">
                              {new Date(member.lastLogin).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                              <span className="text-xs text-gray-500">
                                &nbsp; {new Date(member.lastLogin).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${member.IsMemberActive
                          ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                          : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${member.IsMemberActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            }`}></span>
                          {member.IsMemberActive ? 'Active' : 'Inactive'}
                        </div>
                      </td>
                      {isOwner && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                if (!member.IsMemberActive) {
                                  setSelectedInactiveMember(member);
                                  setShowInactiveMemberDialog(true);
                                  return;
                                }
                                setSelectedMember(member);
                                setShowRevokeDialog(true);
                              }}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${member.IsMemberActive
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              title={member.IsMemberActive ? 'Revoke Access' : 'Grant Access'}
                              disabled={toggling === member.TeamDetailsID}
                            >
                              <FaCog size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (!member.IsMemberActive) {
                                  setSelectedInactiveMember(member);
                                  setShowInactiveMemberDialog(true);
                                  return;
                                }
                                setSelectedMember(member);
                                setShowRemoveDialog(true);
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200"
                              title="Remove Member"
                              disabled={removing === member.TeamDetailsID}
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
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

            {/* Member Access Confirmation Dialog */}
            {showRevokeDialog && selectedMember && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-3 h-3 rounded-full ${selectedMember.IsMemberActive ? 'bg-red-500' : 'bg-green-500'
                      }`}></span>
                    <h3 className="text-lg font-semibold">
                      {selectedMember.IsMemberActive ? 'Revoke Access' : 'Grant Access'}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {selectedMember.IsMemberActive
                      ? `Are you sure you want to revoke access for ${selectedMember.name}? This will prevent them from accessing team resources.`
                      : `Are you sure you want to grant access for ${selectedMember.name}? This will allow them to access team resources.`}
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowRevokeDialog(false);
                        setSelectedMember(null);
                      }}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleToggleStatus(selectedMember.MemberID)}
                      className={`px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 ${selectedMember.IsMemberActive
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        }`}
                      disabled={toggling === selectedMember.MemberID}
                    >
                      {toggling === selectedMember.MemberID ? 'Updating...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Remove Member Confirmation Dialog */}
            {showRemoveDialog && selectedMember && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <h3 className="text-lg font-semibold">
                      Remove Member
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to remove {selectedMember.name} from the team? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowRemoveDialog(false);
                        setSelectedMember(null);
                      }}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRemoveMember(selectedMember.MemberID)}
                      className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      disabled={removing === selectedMember.MemberID}
                    >
                      {removing === selectedMember.MemberID ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Team Settings Modal */}
            {showSettingsModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Team Settings</h3>
                    <button
                      onClick={() => setShowSettingsModal(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleSettingsSave} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={settingsForm.TeamName}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, TeamName: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Description
                      </label>
                      <textarea
                        value={settingsForm.TeamDescription}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, TeamDescription: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        rows="3"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Team Type
                        </label>
                        <select
                          value={settingsForm.TeamType}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, TeamType: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">Select Team Type</option>
                          {teamTypes.map((type) => (
                            <option key={type.Code} value={type.Code}>
                              {type.Value}
                            </option>
                          ))}
                        </select>
                      </div>
                      {isOwner && (
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => setShowConfirmDialog(true)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all duration-200 ${team.IsActive
                              ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200'
                              : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 hover:from-green-100 hover:to-green-200'
                              } ${togglingTeam ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={togglingTeam}
                          >
                            <span className={`w-2 h-2 rounded-full ${team.IsActive ? 'bg-red-500' : 'bg-green-500'
                              }`}></span>
                            {togglingTeam ? 'Updating...' : team.IsActive ? 'Deactivate Team' : 'Activate Team'}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-6">
                      <div className="flex gap-3">
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => setShowDeleteDialog(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200 transition-all duration-200"
                          >
                            <FaTrash className="w-4 h-4" />
                            Delete Team
                          </button>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowSettingsModal(false)}
                          className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
                          disabled={savingSettings}
                        >
                          {savingSettings ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Team Status Confirmation Dialog */}
            {showConfirmDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-3 h-3 rounded-full ${team.IsActive ? 'bg-red-500' : 'bg-green-500'
                      }`}></span>
                    <h3 className="text-lg font-semibold">
                      {team.IsActive ? 'Deactivate Team' : 'Activate Team'}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {team.IsActive
                      ? 'Are you sure you want to deactivate this team? This will prevent members from accessing team resources.'
                      : 'Are you sure you want to activate this team? This will allow members to access team resources.'}
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleToggleTeamStatus}
                      className={`px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 ${team.IsActive
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        }`}
                      disabled={togglingTeam}
                    >
                      {togglingTeam ? 'Updating...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Member Confirmation Dialog */}
            {showAddMemberDialog && userToAdd && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <h3 className="text-lg font-semibold">
                      Add Team Member
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to add {userToAdd.firstName} {userToAdd.lastName} to the team?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowAddMemberDialog(false);
                        setUserToAdd(null);
                      }}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMember}
                      className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      disabled={adding}
                    >
                      {adding ? 'Adding...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Inactive Member Dialog */}
            {showInactiveMemberDialog && selectedInactiveMember && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <h3 className="text-lg font-semibold">
                      Inactive Member
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {selectedInactiveMember.name} is currently inactive in the team. You must activate the member before performing any actions.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowInactiveMemberDialog(false);
                        setSelectedInactiveMember(null);
                      }}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowInactiveMemberDialog(false);
                        setSelectedInactiveMember(null);
                        setSelectedMember(selectedInactiveMember);
                        setShowRevokeDialog(true);
                      }}
                      className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      Activate Member
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Projects Table */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Projects Assigned</h2>
              {activeProjects.length > 0 ? (
                <table className="w-full border rounded-xl overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-left">Project Name</th>
                      <th className="py-3 px-4 text-left">Date Assigned</th>
                      <th className="py-3 px-4 text-left">Deadline</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProjects.map(proj => (
                      <tr key={proj.ProjectID} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium">{proj.Name}</td>
                        <td className="py-3 px-4">{proj.AssignedDate ? new Date(proj.AssignedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}</td>
                        <td className="py-3 px-4">{proj.FinishDate ? new Date(proj.FinishDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${proj.IsActive
                            ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                            : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${proj.IsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                              }`}></span>
                            {proj.IsActive ? 'Project' : 'Inactive'}
                          </span>
                          <span className="ml-2"></span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${proj.TeamIsActive
                            ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                            : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${proj.TeamIsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                              }`}></span>
                            {proj.TeamIsActive ? 'Team' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-400 border rounded-xl bg-gray-50">
                  No Projects
                </div>
              )}
            </div>

            {/* Delete Team Confirmation Dialog */}
            {showDeleteDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <h3 className="text-lg font-semibold">Delete Team</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this team? This action cannot be undone and will remove all team members and associated data.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteDialog(false)}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteTeam}
                      className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      disabled={deletingTeam}
                    >
                      {deletingTeam ? 'Deleting...' : 'Delete Team'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default TeamDetailsPage; 