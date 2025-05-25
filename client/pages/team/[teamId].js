import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import api, { authService } from '../../services/api';
import Layout from '../../components/Layout';
import { FaCog, FaTrash, FaTimes, FaChevronRight } from 'react-icons/fa';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';

// Custom hook for theme-aware classes
const useThemeClasses = () => {
  const { theme } = useTheme();
  
  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;
  };

  return getThemeClasses;
};

const TeamDetailsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { teamId } = router.query;
  const { teams, setTeams, getProjectStatusBadgeComponent, getProjectStatusStyle, getProjectStatus } = useGlobal();
  const { theme } = useTheme();
  const getThemeClasses = useThemeClasses();
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
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [bulkRemoving, setBulkRemoving] = useState(false);
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [bulkRemovingProjects, setBulkRemovingProjects] = useState(false);
  const [showBulkRemoveProjectsDialog, setShowBulkRemoveProjectsDialog] = useState(false);

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

  const handleBulkRemove = async () => {
    if (selectedMembers.length === 0) return;
    setBulkRemoving(true);
    setError('');
    try {
      await api.delete(`/team-details/${teamId}/members/remove-members`, {
        data: { 
          memberIds: selectedMembers,
          OwnerID: user?._id
        }
      });
      // Refresh members
      const res = await api.get(`/team-details/${teamId}`);
      setMembers(res.data.members);
      setSelectedMembers([]);
      setShowBulkRemoveDialog(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove members');
    } finally {
      setBulkRemoving(false);
    }
  };

  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      // Don't include the team owner in selection
      const selectableMembers = members
        .filter(m => m.MemberID !== team.OwnerID)
        .map(m => m.MemberID);
      setSelectedMembers(selectableMembers);
    }
  };

  const handleBulkRemoveProjects = async () => {
    if (selectedProjects.length === 0) return;
    setBulkRemovingProjects(true);
    setError('');
    try {
      await api.delete(`/team-details/${teamId}/projects/remove-projects`, {
        data: { 
          projectIds: selectedProjects,
          OwnerID: user?._id
        }
      });
      // Refresh projects
      const res = await api.get(`/team-details/${teamId}`);
      setActiveProjects(res.data.activeProjects);
      setSelectedProjects([]);
      setShowBulkRemoveProjectsDialog(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove projects');
    } finally {
      setBulkRemovingProjects(false);
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      }
      return [...prev, projectId];
    });
  };

  const handleSelectAllProjects = () => {
    if (selectedProjects.length === activeProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(activeProjects.map(p => p.ProjectID));
    }
  };

  return (
    <Layout>
      <Head>
        <title>{`Team - ${team?.TeamName || 'Loading...'} | TeamLabs`}</title>
        <meta name="theme-color" content={theme === 'dark' ? '#1F2937' : '#FFFFFF'} />
      </Head>
      <div className="mx-auto">
        {/* Breadcrumb Navigation */}
        <div className={getThemeClasses(
          'flex items-center text-sm text-gray-500 mb-4',
          'dark:text-gray-400'
        )}>
          <Link href="/dashboard" className={getThemeClasses(
            'hover:text-blue-600 transition-colors',
            'dark:hover:text-blue-400'
          )}>
            Dashboard
          </Link>
          <FaChevronRight className="mx-2" size={12} />
          <Link href="/teams" className={getThemeClasses(
            'hover:text-blue-600 transition-colors',
            'dark:hover:text-blue-400'
          )}>
            Teams
          </Link>
          <FaChevronRight className="mx-2" size={12} />
          <span className={getThemeClasses(
            'text-gray-700 font-medium',
            'dark:text-gray-300'
          )}>Team Details</span>
        </div>

        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div className={getThemeClasses(
            'text-center text-red-500',
            'dark:text-red-400'
          )}>{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h1 className={getThemeClasses(
                  'text-3xl font-bold text-gray-900',
                  'dark:text-gray-100'
                )}>{team.TeamName}</h1>
              </div>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <div className={getThemeClasses(
                    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${team.IsActive
                      ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                      : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                    }`,
                    `dark:${team.IsActive
                      ? 'from-green-900/30 to-green-800/30 text-green-300 border-green-700/50'
                      : 'from-red-900/30 to-red-800/30 text-red-300 border-red-700/50'
                    }`
                  )}>
                    <span className={`w-2 h-2 rounded-full ${team.IsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {team.IsActive ? 'Active' : 'InActive'}
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className={getThemeClasses(
                      'p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100 transition-colors',
                      'dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700'
                    )}
                    title="Team Settings"
                  >
                    <FaCog size={20} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <p className={getThemeClasses(
                'text-gray-600',
                'dark:text-gray-400'
              )}>{team.TeamDescription}</p>
              {team.teamTypeValue && (
                <div className={getThemeClasses(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-blue-50 text-blue-700 border border-blue-200',
                  'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50'
                )}>
                  {team.teamTypeValue}
                </div>
              )}
            </div>

            {isOwner && (
              <form onSubmit={handleAddMember} className="mb-4 flex flex-col gap-2">
                <label className={getThemeClasses(
                  'block text-gray-700 font-semibold mb-1',
                  'dark:text-gray-300'
                )}>Search for a Member (search by name, email, or UserID)</label>
                <input
                  type="text"
                  className={getThemeClasses(
                    'border rounded-xl px-4 py-2.5 w-full md:w-96 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
                    'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
                  )}
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
                    <ul className={getThemeClasses(
                      'border rounded-xl bg-white max-h-48 overflow-y-auto z-10 shadow-md',
                      'dark:bg-gray-800 dark:border-gray-700'
                    )}>
                      {filteredUsers.map((user, index) => (
                        <li
                          key={`${user._id}-${index}`}
                          className={getThemeClasses(
                            'px-4 py-2.5 border-b last:border-b-0 transition-colors duration-150',
                            'dark:border-gray-700'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className={getThemeClasses(
                              'flex-1 cursor-pointer hover:bg-blue-50 rounded-lg p-2',
                              'dark:hover:bg-blue-900/30'
                            )}
                              onClick={() => {
                                setSelectedUser(user);
                                setSearch(user.firstName + ' ' + user.lastName + ' (' + user.email + ')');
                                setIsInputFocused(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <div className={getThemeClasses(
                                  'font-medium text-gray-900',
                                  'dark:text-gray-100'
                                )}>
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className={getThemeClasses(
                                  'text-sm text-gray-600',
                                  'dark:text-gray-400'
                                )}>
                                  {user.email}
                                </div>
                                <div className={getThemeClasses(
                                  'text-xs text-gray-400 mt-0.5',
                                  'dark:text-gray-500'
                                )}>
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
                              className={getThemeClasses(
                                'ml-2 px-3 py-1.5 text-sm text-white font-medium rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm',
                                'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
                              )}
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
                        className={getThemeClasses(
                          'w-full mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-xl transition-colors duration-200',
                          'dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30'
                        )}
                      >
                        Show All Users ({orgUsers.length})
                      </button>
                    )}
                  </div>
                )}
              </form>
            )}

            {/* Team Members and Projects Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Members Table */}
              <div className={getThemeClasses(
                'bg-white rounded-xl shadow-sm border border-gray-200',
                'dark:bg-[#1F1F1F] dark:border-[#424242]'
              )}>
                <div className={getThemeClasses(
                  'p-4 border-b border-gray-200',
                  'dark:border-gray-700'
                )}>
                  <div className="flex items-center justify-between">
                    <h2 className={getThemeClasses(
                      'text-xl font-semibold text-gray-900',
                      'dark:text-gray-100'
                    )}>Team Members</h2>
                    {selectedMembers.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className={getThemeClasses(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700',
                          'dark:bg-blue-900/30 dark:text-blue-300'
                        )}>
                          <span className="text-sm font-medium">{selectedMembers.length} selected</span>
                          <button
                            onClick={() => setSelectedMembers([])}
                            className={getThemeClasses(
                              'p-1 hover:bg-blue-100 rounded-full transition-colors',
                              'dark:hover:bg-blue-900/50'
                            )}
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => setShowBulkRemoveDialog(true)}
                          className={getThemeClasses(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors',
                            'dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                          )}
                        >
                          <FaTrash size={14} />
                          Remove Selected
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={getThemeClasses(
                        'bg-gray-50 border-b border-gray-200',
                        'dark:bg-gray-700/50 dark:border-gray-700'
                      )}>
                        {isOwner && (
                          <th className="py-3 px-4 text-center w-[50px]">
                            <input
                              type="checkbox"
                              checked={selectedMembers.length === members.filter(m => m.MemberID !== team.OwnerID).length}
                              onChange={handleSelectAll}
                              className={getThemeClasses(
                                'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                              )}
                            />
                          </th>
                        )}
                        <th className={getThemeClasses(
                          'py-3 px-4 text-left w-[300px] text-gray-700',
                          'dark:text-gray-300'
                        )}>Member</th>
                        <th className={getThemeClasses(
                          'hidden md:table-cell py-3 px-4 text-left w-[200px] text-gray-700',
                          'dark:text-gray-300'
                        )}>Date Added</th>
                        <th className={getThemeClasses(
                          'py-3 px-4 text-left w-[200px] text-gray-700',
                          'dark:text-gray-300'
                        )}>Last Active</th>
                        <th className={getThemeClasses(
                          'hidden md:table-cell py-3 px-4 text-center w-[150px] text-gray-700',
                          'dark:text-gray-300'
                        )}>Status</th>
                        {isOwner && <th className={getThemeClasses(
                          'py-3 px-4 text-center w-[150px] text-gray-700',
                          'dark:text-gray-300'
                        )}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(member => (
                        <tr key={member.TeamDetailsID} className={getThemeClasses(
                          'border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0',
                          'dark:border-gray-700 dark:hover:bg-gray-700/50'
                        )}>
                          {isOwner && (
                            <td className="py-3 px-4 text-center">
                              {member.MemberID !== team.OwnerID && (
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.includes(member.MemberID)}
                                  onChange={() => handleSelectMember(member.MemberID)}
                                  className={getThemeClasses(
                                    'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                    'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                                  )}
                                />
                              )}
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={getThemeClasses(
                                'w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium',
                                'dark:bg-blue-900/50 dark:text-blue-300'
                              )}>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex flex-col">
                                <span className={getThemeClasses(
                                  'font-medium text-gray-900',
                                  'dark:text-gray-100'
                                )}>{member.name}</span>
                                <span className={getThemeClasses(
                                  'text-sm text-gray-500',
                                  'dark:text-gray-400'
                                )}>{member.email}</span>
                                {/* Show status badge on mobile inline with name */}
                                <div className="md:hidden mt-1">
                                  <div className={getThemeClasses(
                                    `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${member.IsMemberActive
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                    }`,
                                    `dark:${member.IsMemberActive
                                      ? 'bg-green-900/30 text-green-300'
                                      : 'bg-red-900/30 text-red-300'
                                    }`
                                  )}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${member.IsMemberActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {member.IsMemberActive ? 'Active' : 'Inactive'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={getThemeClasses(
                            'hidden md:table-cell py-3 px-4 text-gray-600',
                            'dark:text-gray-400'
                          )}>
                            {new Date(member.CreatedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4">
                            {member.lastLogin ? (
                              <div className="flex flex-col">
                                <span className={getThemeClasses(
                                  'text-sm text-gray-900',
                                  'dark:text-gray-100'
                                )}>
                                  {new Date(member.lastLogin).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                  <span className={getThemeClasses(
                                    'text-xs text-gray-500',
                                    'dark:text-gray-400'
                                  )}>
                                    &nbsp; {new Date(member.lastLogin).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </span>
                              </div>
                            ) : (
                              <span className={getThemeClasses(
                                'text-sm text-gray-400',
                                'dark:text-gray-500'
                              )}>Never</span>
                            )}
                          </td>
                          <td className="hidden md:table-cell py-3 px-4 text-center">
                            <div className={getThemeClasses(
                              `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${member.IsMemberActive
                                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                                : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                              }`,
                              `dark:${member.IsMemberActive
                                ? 'from-green-900/30 to-green-800/30 text-green-300 border-green-700/50'
                                : 'from-red-900/30 to-red-800/30 text-red-300 border-red-700/50'
                              }`
                            )}>
                              <span className={`w-2 h-2 rounded-full ${member.IsMemberActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
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
                                  className={getThemeClasses(
                                    `inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${member.IsMemberActive
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`,
                                    `dark:${member.IsMemberActive
                                      ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                                      : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'
                                    }`
                                  )}
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
                                  className={getThemeClasses(
                                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                    'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                                  )}
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
                        <tr>
                          <td colSpan={isOwner ? 5 : 4} className={getThemeClasses(
                            'text-center py-8 text-gray-400 bg-gray-50',
                            'dark:text-gray-500 dark:bg-gray-800/50'
                          )}>
                            No members in this team
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Projects Table */}
              <div className={getThemeClasses(
                'bg-white rounded-xl shadow-sm border border-gray-200',
                'dark:bg-[#1F1F1F] dark:border-[#424242]'
              )}>
                <div className={getThemeClasses(
                  'p-4 border-b border-gray-200',
                  'dark:border-gray-700'
                )}>
                  <div className="flex items-center justify-between">
                    <h2 className={getThemeClasses(
                      'text-xl font-semibold text-gray-900',
                      'dark:text-gray-100'
                    )}>Projects Assigned</h2>
                    {selectedProjects.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className={getThemeClasses(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700',
                          'dark:bg-blue-900/30 dark:text-blue-300'
                        )}>
                          <span className="text-sm font-medium">{selectedProjects.length} selected</span>
                          <button
                            onClick={() => setSelectedProjects([])}
                            className={getThemeClasses(
                              'p-1 hover:bg-blue-100 rounded-full transition-colors',
                              'dark:hover:bg-blue-900/50'
                            )}
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => setShowBulkRemoveProjectsDialog(true)}
                          className={getThemeClasses(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors',
                            'dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                          )}
                        >
                          <FaTrash size={14} />
                          Remove Selected
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {activeProjects.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className={getThemeClasses(
                          'bg-gray-50 border-b border-gray-200',
                          'dark:bg-gray-700/50 dark:border-gray-700'
                        )}>
                          {isOwner && (
                            <th className="py-3 px-4 text-center w-[50px]">
                              <input
                                type="checkbox"
                                checked={selectedProjects.length === activeProjects.length}
                                onChange={handleSelectAllProjects}
                                className={getThemeClasses(
                                  'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                  'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                                )}
                              />
                            </th>
                          )}
                          <th className={getThemeClasses(
                            'py-3 px-4 text-left text-gray-700',
                            'dark:text-gray-300'
                          )}>Project Name</th>
                          <th className={getThemeClasses(
                            'py-3 px-4 text-left text-gray-700',
                            'dark:text-gray-300'
                          )}>Date Assigned</th>
                          <th className={getThemeClasses(
                            'py-3 px-4 text-left text-gray-700',
                            'dark:text-gray-300'
                          )}>Deadline</th>
                          <th className={getThemeClasses(
                            'py-3 px-4 text-center text-gray-700',
                            'dark:text-gray-300'
                          )}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeProjects.map(proj => {
                          const projectStatus = getProjectStatus(proj.ProjectStatusID);
                          const statusStyle = getProjectStatusStyle(projectStatus.Code);

                          return (
                            <tr key={proj.ProjectID} className={getThemeClasses(
                              'border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0',
                              'dark:border-gray-700 dark:hover:bg-gray-700/50'
                            )}>
                              {isOwner && (
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedProjects.includes(proj.ProjectID)}
                                    onChange={() => handleSelectProject(proj.ProjectID)}
                                    className={getThemeClasses(
                                      'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                      'dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600'
                                    )}
                                  />
                                </td>
                              )}
                              <td className={getThemeClasses(
                                'py-3 px-4 font-medium text-gray-900',
                                'dark:text-gray-100'
                              )}>{proj.Name}</td>
                              <td className={getThemeClasses(
                                'py-3 px-4 text-gray-600',
                                'dark:text-gray-400'
                              )}>
                                {proj.AssignedDate ? new Date(proj.AssignedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                              </td>
                              <td className={getThemeClasses(
                                'py-3 px-4 text-gray-600',
                                'dark:text-gray-400'
                              )}>
                                {proj.FinishDate ? new Date(proj.FinishDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getProjectStatusBadgeComponent(proj.ProjectStatusID)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className={getThemeClasses(
                      'text-center py-8 text-gray-400 bg-gray-50',
                      'dark:text-gray-500 dark:bg-gray-800/50'
                    )}>
                      No Projects Assigned
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Member Access Confirmation Dialog */}
            {showRevokeDialog && selectedMember && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={getThemeClasses(
                  'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100',
                  'dark:bg-gray-800 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-3 h-3 rounded-full ${selectedMember.IsMemberActive ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    <h3 className={getThemeClasses(
                      'text-lg font-semibold',
                      'dark:text-gray-100'
                    )}>
                      {selectedMember.IsMemberActive ? 'Revoke Access' : 'Grant Access'}
                    </h3>
                  </div>
                  <p className={getThemeClasses(
                    'text-gray-600 mb-6',
                    'dark:text-gray-400'
                  )}>
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
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleToggleStatus(selectedMember.MemberID)}
                      className={getThemeClasses(
                        `px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 ${selectedMember.IsMemberActive ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'}`,
                        `dark:${selectedMember.IsMemberActive ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'}`
                      )}
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
                <div className={getThemeClasses(
                  'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100',
                  'dark:bg-gray-800 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <h3 className={getThemeClasses(
                      'text-lg font-semibold',
                      'dark:text-gray-100'
                    )}>
                      Remove Member
                    </h3>
                  </div>
                  <p className={getThemeClasses(
                    'text-gray-600 mb-6',
                    'dark:text-gray-400'
                  )}>
                    Are you sure you want to remove {selectedMember.name} from the team? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowRemoveDialog(false);
                        setSelectedMember(null);
                      }}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRemoveMember(selectedMember.MemberID)}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
                        'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                      )}
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
                <div className={getThemeClasses(
                  'bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-lg border border-gray-100',
                  'dark:bg-gray-800 dark:border-gray-700'
                )}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={getThemeClasses(
                      'text-xl font-semibold text-gray-900',
                      'dark:text-gray-100'
                    )}>Team Settings</h3>
                    <button
                      onClick={() => setShowSettingsModal(false)}
                      className={getThemeClasses(
                        'text-gray-400 hover:text-gray-600 text-2xl font-bold',
                        'dark:text-gray-500 dark:hover:text-gray-300'
                      )}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleSettingsSave} className="space-y-4">
                    <div>
                      <label className={getThemeClasses(
                        'block text-sm font-medium text-gray-700 mb-1',
                        'dark:text-gray-300'
                      )}>
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={settingsForm.TeamName}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, TeamName: e.target.value }))}
                        className={getThemeClasses(
                          'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
                          'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
                        )}
                        required
                      />
                    </div>
                    <div>
                      <label className={getThemeClasses(
                        'block text-sm font-medium text-gray-700 mb-1',
                        'dark:text-gray-300'
                      )}>
                        Team Description
                      </label>
                      <textarea
                        value={settingsForm.TeamDescription}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, TeamDescription: e.target.value }))}
                        className={getThemeClasses(
                          'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
                          'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
                        )}
                        rows="3"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className={getThemeClasses(
                          'block text-sm font-medium text-gray-700 mb-1',
                          'dark:text-gray-300'
                        )}>
                          Team Type
                        </label>
                        <select
                          value={settingsForm.TeamType}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, TeamType: e.target.value }))}
                          className={getThemeClasses(
                            'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
                            'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
                          )}
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
                            className={getThemeClasses(
                              `inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all duration-200 ${team.IsActive ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200' : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 hover:from-green-100 hover:to-green-200'} ${togglingTeam ? 'opacity-50 cursor-not-allowed' : ''}`,
                              `dark:${team.IsActive ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'} ${togglingTeam ? 'opacity-50 cursor-not-allowed' : ''}`
                            )}
                            disabled={togglingTeam}
                          >
                            <span className={`w-2 h-2 rounded-full ${team.IsActive ? 'bg-red-500' : 'bg-green-500'}`}></span>
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
                            className={getThemeClasses(
                              'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200 transition-all duration-200',
                              'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                            )}
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
                          className={getThemeClasses(
                            'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                            'dark:text-gray-400 dark:hover:bg-gray-700'
                          )}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={getThemeClasses(
                            'px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200',
                            'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
                          )}
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
                <div className={getThemeClasses(
                  'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100',
                  'dark:bg-gray-800 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-3 h-3 rounded-full ${team.IsActive ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    <h3 className={getThemeClasses(
                      'text-lg font-semibold',
                      'dark:text-gray-100'
                    )}>
                      {team.IsActive ? 'Deactivate Team' : 'Activate Team'}
                    </h3>
                  </div>
                  <p className={getThemeClasses(
                    'text-gray-600 mb-6',
                    'dark:text-gray-400'
                  )}>
                    {team.IsActive
                      ? 'Are you sure you want to deactivate this team? This will prevent members from accessing team resources.'
                      : 'Are you sure you want to activate this team? This will allow members to access team resources.'}
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleToggleTeamStatus}
                      className={getThemeClasses(
                        `px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 ${team.IsActive ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'}`,
                        `dark:${team.IsActive ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'}`
                      )}
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
                <div className={getThemeClasses(
                  'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100',
                  'dark:bg-gray-800 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <h3 className={getThemeClasses(
                      'text-lg font-semibold',
                      'dark:text-gray-100'
                    )}>
                      Add Team Member
                    </h3>
                  </div>
                  <p className={getThemeClasses(
                    'text-gray-600 mb-6',
                    'dark:text-gray-400'
                  )}>
                    Are you sure you want to add {userToAdd.firstName} {userToAdd.lastName} to the team?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowAddMemberDialog(false);
                        setUserToAdd(null);
                      }}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMember}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
                        'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
                      )}
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
                <div className={getThemeClasses(
                  'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100',
                  'dark:bg-gray-800 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <h3 className={getThemeClasses(
                      'text-lg font-semibold',
                      'dark:text-gray-100'
                    )}>
                      Inactive Member
                    </h3>
                  </div>
                  <p className={getThemeClasses(
                    'text-gray-600 mb-6',
                    'dark:text-gray-400'
                  )}>
                    {selectedInactiveMember.name} is currently inactive in the team. You must activate the member before performing any actions.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowInactiveMemberDialog(false);
                        setSelectedInactiveMember(null);
                      }}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
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
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
                        'dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70'
                      )}
                    >
                      Activate Member
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Team Confirmation Dialog */}
            {showDeleteDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={getThemeClasses(
                  'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100',
                  'dark:bg-gray-800 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <h3 className={getThemeClasses(
                      'text-lg font-semibold',
                      'dark:text-gray-100'
                    )}>Delete Team</h3>
                  </div>
                  <p className={getThemeClasses(
                    'text-gray-600 mb-6',
                    'dark:text-gray-400'
                  )}>
                    Are you sure you want to delete this team? This action cannot be undone and will remove all team members and associated data.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteDialog(false)}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteTeam}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
                        'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                      )}
                      disabled={deletingTeam}
                    >
                      {deletingTeam ? 'Deleting...' : 'Delete Team'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Remove Projects Confirmation Dialog */}
            {showBulkRemoveProjectsDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={getThemeClasses(
                  'bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100',
                  'dark:bg-gray-800 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <h3 className={getThemeClasses(
                      'text-lg font-semibold',
                      'dark:text-gray-100'
                    )}>Remove Selected Projects</h3>
                  </div>
                  <p className={getThemeClasses(
                    'text-gray-600 mb-6',
                    'dark:text-gray-400'
                  )}>
                    Are you sure you want to remove {selectedProjects.length} selected project{selectedProjects.length !== 1 ? 's' : ''} from the team? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowBulkRemoveProjectsDialog(false)}
                      className={getThemeClasses(
                        'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                        'dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkRemoveProjects}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
                        'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                      )}
                      disabled={bulkRemovingProjects}
                    >
                      {bulkRemovingProjects ? 'Removing...' : 'Remove Projects'}
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