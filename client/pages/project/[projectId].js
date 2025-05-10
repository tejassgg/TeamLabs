import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api, { authService } from '../../services/api';
import Layout from '../../components/Layout';
import { FaUsers, FaPlus, FaTrash, FaCheckCircle, FaTimesCircle, FaCog, FaTimes } from 'react-icons/fa';

const ProjectDetailsPage = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const [project, setProject] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgTeams, setOrgTeams] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState('');
  const [search, setSearch] = useState('');
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ Name: '', Description: '', FinishDate: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removingTeam, setRemovingTeam] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    if (projectId) {
      // Fetch all project details in one call
      api.get(`/project-details/${projectId}`)
        .then(res => {
          setProject(res.data.project);
          setTeams(res.data.teams);
          setOrgTeams(res.data.orgTeams);
        })
        .catch(err => {
          setError('Failed to fetch project');
          router.push('/dashboard');
        })
        .finally(() => setLoading(false));
    }
  }, [projectId, router]);

  useEffect(() => {
    setFilteredTeams([]);
  }, [orgTeams, teams]);

  // Filter teams as search changes
  useEffect(() => {
    if (!isInputFocused) {
      setFilteredTeams([]);
      return;
    }
    if (!search) {
      // Show first 10 available teams by default
      const assignedIds = new Set(teams.map(t => t.TeamID));
      const availableTeams = orgTeams.filter(t => !assignedIds.has(t.TeamID));
      setFilteredTeams(availableTeams.slice(0, 10));
      return;
    }
    const s = search.toLowerCase();
    const assignedIds = new Set(teams.map(t => t.TeamID));
    const matchingTeams = orgTeams.filter(t =>
      !assignedIds.has(t.TeamID) && (
        (t.TeamName && t.TeamName.toLowerCase().includes(s)) ||
        (t.TeamDescription && t.TeamDescription.toLowerCase().includes(s)) ||
        (t.TeamID && t.TeamID.toLowerCase().includes(s))
      )
    );
    setFilteredTeams(matchingTeams.slice(0, 10));
  }, [search, orgTeams, teams, isInputFocused]);

  // Calculate deadline timer
  useEffect(() => {
    if (project && project.FinishDate) {
      const interval = setInterval(() => {
        const now = new Date();
        const finish = new Date(project.FinishDate);
        const diff = finish - now;
        if (diff <= 0) {
          setDeadline('Deadline Passed');
          clearInterval(interval);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          setDeadline(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setDeadline('No Deadline');
    }
  }, [project]);

  useEffect(() => {
    if (project) {
      setSettingsForm({
        Name: project.Name || '',
        Description: project.Description || '',
        FinishDate: project.FinishDate ? new Date(project.FinishDate).toISOString().slice(0, 10) : ''
      });
    }
  }, [project]);

  const isOwner = currentUser && project && currentUser._id === project.ProjectOwner;

  const handleAddTeam = async (teamId) => {
    if (!teamId) return;
    setAdding(true);
    setError('');
    try {
      await api.post(`/project-details/${projectId}/add-team`, {
        TeamID: teamId,
        ModifiedBy: currentUser._id
      });
      // Refresh teams
      const res = await api.get(`/project-details/${projectId}`);
      setTeams(res.data.teams);
      setShowAddTeamDialog(false);
      setSelectedTeam(null);
      setSearch('');
      setIsInputFocused(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add team');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTeamStatus = async (teamId) => {
    setToggling(teamId);
    setError('');
    try {
      await api.patch(`/project-details/${projectId}/team/${teamId}/toggle`, {
        ModifiedBy: currentUser._id
      });
      // Refresh teams
      const res = await api.get(`/project-details/${projectId}`);
      setTeams(res.data.teams);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update team status');
    } finally {
      setToggling('');
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.patch(`/projects/${project.ProjectID}`, {
        Name: settingsForm.Name,
        Description: settingsForm.Description,
        FinishDate: settingsForm.FinishDate,
        ModifiedBy: currentUser._id,
        ModifiedDate: new Date()
      });
      setProject(res.data);
      setShowSettingsModal(false);
    } catch (err) {
      alert('Failed to update project');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleProjectStatus = async () => {
    setTogglingStatus(true);
    try {
      const res = await api.patch(`/projects/${project.ProjectID}/toggle-status`);
      setProject(res.data);
      setShowSettingsModal(false);
    } catch (err) {
      alert('Failed to update project status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    setRemoving(true);
    setError('');
    try {
      await api.delete(`/project-details/${projectId}/team/${teamId}`, {
        data: { ModifiedBy: currentUser._id }
      });
      // Refresh teams
      const res = await api.get(`/project-details/${projectId}`);
      setTeams(res.data.teams);
      setShowRemoveDialog(false);
      setRemovingTeam(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove team');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return <Layout><div className="p-8">Loading...</div></Layout>;
  }

  if (!project) {
    return <Layout><div className="p-8 text-red-500">Project not found.</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.Name}</h1>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
              project.IsActive
                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                project.IsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></span>
              {project.IsActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          {isOwner && (
            <button
              className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100 transition-colors"
              title="Project Settings"
              onClick={() => setShowSettingsModal(true)}
            >
              <FaCog size={20} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-gray-600">{project.Description}</p>
          {project.FinishDate && (
            <div className="ml-auto flex items-center gap-2">
              <span className="font-semibold text-gray-700">Deadline:</span>
              <span className={deadline === 'Deadline Passed' ? 'text-red-600 font-bold' : 'text-blue-600 font-mono font-bold'}>{deadline}</span>
            </div>
          )}
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Teams Assigned</h2>
          <table className="w-full border rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left w-[300px]">Team Name</th>
                <th className="py-3 px-4 text-left w-[120px]">Status</th>
                <th className="py-3 px-4 text-left w-[180px]">Assigned Date</th>
                {isOwner && <th className="py-3 px-4 text-center w-[250px]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.TeamID} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">{orgTeams.find(t => t.TeamID === team.TeamID)?.TeamName || team.TeamID}</td>
                  <td className="py-3 px-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                      team.IsActive
                        ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                        : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        team.IsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`}></span>
                      {team.IsActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="py-3 px-4">{team.CreatedDate ? new Date(team.CreatedDate).toLocaleDateString() : '-'}</td>
                  {isOwner && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${
                            team.IsActive
                              ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200'
                              : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 hover:from-green-100 hover:to-green-200'
                          } ${toggling === team.TeamID ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => handleToggleTeamStatus(team.TeamID)}
                          disabled={toggling === team.TeamID}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            team.IsActive ? 'bg-red-500' : 'bg-green-500'
                          }`}></span>
                          {toggling === team.TeamID ? 'Updating...' : team.IsActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200"
                          onClick={() => {
                            setRemovingTeam(team);
                            setShowRemoveDialog(true);
                          }}
                          title="Remove Team"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {teams.length === 0 && (
                <tr><td colSpan={isOwner ? 4 : 3} className="text-center py-4 text-gray-400">No teams assigned to this project.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {isOwner && (
          <div className="mb-4 flex flex-col gap-2">
            <label className="block text-gray-700 font-semibold mb-1">Search for a Team (search by name, description, or TeamID)</label>
            <input
              type="text"
              className="border rounded-xl px-4 py-2.5 w-full md:w-96 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
              }}
              onFocus={() => {
                setIsInputFocused(true);
                if (!search) {
                  const assignedIds = new Set(teams.map(t => t.TeamID));
                  const availableTeams = orgTeams.filter(t => !assignedIds.has(t.TeamID));
                  setFilteredTeams(availableTeams.slice(0, 10));
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
            {isInputFocused && filteredTeams.length > 0 && (
              <div className="w-full md:w-96">
                <ul className="border rounded-xl bg-white max-h-48 overflow-y-auto z-10 shadow-md">
                  {filteredTeams.map((team, index) => (
                    <li
                      key={`${team.TeamID}-${index}`}
                      className="px-4 py-2.5 border-b last:border-b-0 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 cursor-pointer hover:bg-blue-50 rounded-lg p-2"
                          onClick={() => {
                            setSelectedTeam(team.TeamID);
                            setSearch(team.TeamName);
                            setIsInputFocused(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">{team.TeamName}</div>
                            <div className="text-sm text-gray-600">{team.TeamDescription}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {team.memberCount || 0} {team.memberCount === 1 ? 'member' : 'members'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddTeam(team.TeamID)}
                          className="ml-2 px-3 py-1.5 text-sm text-white font-medium rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
                          disabled={adding}
                        >
                          {adding ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Project Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSettingsSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={settingsForm.Name}
                    onChange={e => setSettingsForm(f => ({ ...f, Name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    maxLength={50}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={settingsForm.Description}
                    onChange={e => setSettingsForm(f => ({ ...f, Description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    maxLength={100}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Finish Date</label>
                  <input
                    type="date"
                    value={settingsForm.FinishDate}
                    onChange={e => setSettingsForm(f => ({ ...f, FinishDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={handleToggleProjectStatus}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${project.IsActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    disabled={togglingStatus}
                  >
                    {togglingStatus ? 'Updating...' : project.IsActive ? 'Deactivate Project' : 'Activate Project'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
                    disabled={savingSettings}
                  >
                    {savingSettings ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Remove Team Confirmation Dialog */}
        {showRemoveDialog && removingTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className="text-lg font-semibold">
                  Remove Team
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove {orgTeams.find(t => t.TeamID === removingTeam.TeamID)?.TeamName || removingTeam.TeamID} from this project? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRemoveDialog(false);
                    setRemovingTeam(null);
                  }}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveTeam(removingTeam.TeamID)}
                  className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  disabled={removing}
                >
                  {removing ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ProjectDetailsPage;
