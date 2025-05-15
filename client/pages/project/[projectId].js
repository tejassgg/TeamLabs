import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api, { authService, taskService } from '../../services/api';
import Layout from '../../components/Layout';
import { FaTrash, FaCog, FaTimes, FaClock, FaUserCheck, FaSpinner, FaCode, FaVial, FaShieldAlt, FaRocket, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';
import LoadingScreen from '../../components/LoadingScreen';
import AddTaskModal from '../../components/AddTaskModal';
import { toast } from 'react-toastify';

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
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [settingsForm, setSettingsForm] = useState({
    Name: '',
    Description: '',
    FinishDate: '',
    ProjectStatusID: 1 // Default to 'Not Assigned'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removingTeam, setRemovingTeam] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [currentProjectStatus, setCurrentProjectStatus] = useState(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [userStories, setUserStories] = useState([]);

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
          setTaskList(res.data.taskList);
          setUserStories(res.data.userStories);
          console.log(res.data.taskList);
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
          setDeadline(`${days} ${days === 1 ? 'Day' : 'Days'} Left`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setDeadline('No Deadline');
    }
  }, [project]);

  // Helper function to get deadline status and styling
  const getDeadlineStatus = (deadlineText) => {
    if (deadlineText === 'Deadline Passed') {
      return {
        text: 'Deadline Passed',
        bgColor: 'from-red-50 to-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        dotColor: 'bg-red-500'
      };
    }
    if (deadlineText === 'No Deadline') {
      return {
        text: 'No Deadline',
        bgColor: 'from-gray-50 to-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        dotColor: 'bg-gray-500'
      };
    }

    const daysLeft = parseInt(deadlineText);
    if (daysLeft <= 3) {
      return {
        text: deadlineText,
        bgColor: 'from-red-50 to-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        dotColor: 'bg-red-500'
      };
    } else if (daysLeft <= 7) {
      return {
        text: deadlineText,
        bgColor: 'from-yellow-50 to-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        dotColor: 'bg-yellow-500'
      };
    } else {
      return {
        text: deadlineText,
        bgColor: 'from-green-50 to-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        dotColor: 'bg-green-500'
      };
    }
  };

  useEffect(() => {
    if (project) {
      setSettingsForm({
        Name: project.Name || '',
        Description: project.Description || '',
        FinishDate: project.FinishDate ? new Date(project.FinishDate).toISOString().slice(0, 10) : '',
        ProjectStatusID: project.ProjectStatusID || 1
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
        ProjectStatusID: settingsForm.ProjectStatusID,
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

  // Add useEffect to fetch project statuses
  useEffect(() => {
    const fetchProjectStatuses = async () => {
      try {
        const response = await api.get('/common-types/project-statuses');
        setProjectStatuses(response.data);
      } catch (err) {
        console.error('Failed to fetch project statuses:', err);
      }
    };
    fetchProjectStatuses();
  }, []);

  // Add useEffect to fetch current project status
  useEffect(() => {
    const fetchCurrentProjectStatus = async () => {
      if (project?.ProjectStatusID) {
        try {
          const response = await api.get('/common-types/project-statuses');
          const status = response.data.find(s => s.Code === project.ProjectStatusID);
          setCurrentProjectStatus(status);
        } catch (err) {
          console.error('Failed to fetch project status:', err);
        }
      }
    };
    fetchCurrentProjectStatus();
  }, [project?.ProjectStatusID]);

  const fetchProjectTasks = async () => {
    try {
      const allTasks = await taskService.getTaskDetails();
      setUserStories(allTasks.filter(task => task.ProjectID_FK === projectId && task.Type === 'User Story'));
      setTaskList(allTasks.filter(task => task.ProjectID_FK === projectId && task.Type !== 'User Story'));
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectTasks();
    }
  }, [projectId]);

  const handleAddTask = async (taskData) => {
    try {
      // Set ParentID to selected user story
      const data = await taskService.addTaskDetails(taskData, 'fromProject');
      setTaskList([...projectTasks, data]);
      toast.success('Task added successfully!');
      fetchProjectTasks(); // Refresh the list
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  // Helper function to get task status styles
  const getTaskStatusStyle = (statusCode) => {
    const styles = {
      1: { // Not Assigned
        bgColor: 'from-gray-50 to-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        icon: FaTimes,
        iconColor: 'text-gray-500'
      },
      2: { // Assigned
        bgColor: 'from-blue-50 to-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: FaCheckCircle,
        iconColor: 'text-blue-500'
      },
      3: { // In Progress
        bgColor: 'from-yellow-50 to-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        icon: FaClock,
        iconColor: 'text-yellow-500'
      },
      4: { // Development
        bgColor: 'from-purple-50 to-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        icon: FaCode,
        iconColor: 'text-purple-500'
      },
      5: { // Testing
        bgColor: 'from-orange-50 to-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        icon: FaVial,
        iconColor: 'text-orange-500'
      },
      6: { // Quality Assurance
        bgColor: 'from-indigo-50 to-indigo-100',
        textColor: 'text-indigo-700',
        borderColor: 'border-indigo-200',
        icon: FaShieldAlt,
        iconColor: 'text-indigo-500'
      },
      7: { // Deployment
        bgColor: 'from-pink-50 to-pink-100',
        textColor: 'text-pink-700',
        borderColor: 'border-pink-200',
        icon: FaRocket,
        iconColor: 'text-pink-500'
      },
      8: { // Completed
        bgColor: 'from-green-50 to-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        icon: FaCheckCircle,
        iconColor: 'text-green-500'
      }
    };

    return styles[statusCode] || styles[1]; // Default to Not Assigned if status not found
  };

  // Helper function to get task status text
  const getTaskStatusText = (statusCode) => {
    const statusTexts = {
      1: 'Not Assigned',
      2: 'Assigned',
      3: 'In Progress',
      4: 'Development',
      5: 'Testing',
      6: 'Quality Assurance',
      7: 'Deployment',
      8: 'Completed'
    };
    return statusTexts[statusCode] || 'Unknown';
  };

  if (loading) {
    return <Layout>
      <LoadingScreen />
    </Layout>;
  }

  if (!project) {
    return <Layout><div className="p-8 text-red-500">Project not found.</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold pr-8">{project.Name}</h1>
            {currentProjectStatus && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {currentProjectStatus.Value}
              </div>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${project.IsActive
                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
              }`}>
              <span className={`w-2 h-2 rounded-full ${project.IsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></span>
              {project.IsActive ? 'Active' : 'Inactive'}
            </div>
            <button
              className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100 transition-colors"
              title="Project Settings"
              onClick={() => setShowSettingsModal(true)}
            >
              <FaCog size={20} />
            </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-gray-600">{project.Description}</p>
          {project.FinishDate && (
            <div className="ml-auto flex items-center gap-2">
              <span className="font-semibold text-gray-700">Deadline:</span>
              {(() => {
                const status = getDeadlineStatus(deadline);
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-gradient-to-r ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                    <span className={`w-2 h-2 rounded-full ${status.dotColor} ${deadline !== 'Deadline Passed' && deadline !== 'No Deadline' ? 'animate-pulse' : ''}`}></span>
                    {status.text}
                  </span>
                );
              })()}
            </div>
          )}
          {userStories.length > 0 && (
            <button
              className="ml-4 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
              onClick={() => setIsAddTaskOpen(true)}
            >
              + Add Task
            </button>
          )}
        </div>

        {isOwner && (
          <div className="mb-6 flex flex-col gap-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Teams Assigned Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Teams Assigned</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
            <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left w-[300px]">Team Name</th>
                <th className="py-3 px-4 text-left w-[200px]">Date Added</th>
                <th className="py-3 px-4 text-center w-[150px]">Status</th>
                {isOwner && <th className="py-3 px-4 text-center w-[150px]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {teams.map(team => {
                const teamDetails = orgTeams.find(t => t.TeamID === team.TeamID);
                return (
                      <tr key={team.TeamID} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                  <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                          {teamDetails?.TeamName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{teamDetails?.TeamName || team.TeamID}</span>
                          {teamDetails?.TeamDescription && (
                            <span className="text-sm text-gray-500">{teamDetails.TeamDescription}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{team.CreatedDate ? new Date(team.CreatedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}</td>
                    <td className="py-3 px-4 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${team.IsActive
                        ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                        : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                      }`}>
                            <span className={`w-2 h-2 rounded-full ${team.IsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`}></span>
                      {team.IsActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  {isOwner && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleTeamStatus(team.TeamID)}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${team.IsActive
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={team.IsActive ? 'Revoke Access' : 'Grant Access'}
                          disabled={toggling === team.TeamID}
                        >
                            <FaCog size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setRemovingTeam(team);
                            setShowRemoveDialog(true);
                          }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200"
                          title="Remove Team"
                            disabled={removing}
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
              {teams.length === 0 && (
                    <tr>
                      <td colSpan={isOwner ? 4 : 3} className="text-center py-8 text-gray-400 bg-gray-50">
                        No teams assigned to this project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Stories Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">User Stories</h2>
            </div>
            <div className="overflow-x-auto">
              {userStories.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50">
                  No user stories for this project.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3 px-4 text-left w-[300px]">Name</th>
                      <th className="py-3 px-4 text-left w-[200px]">Date Created</th>
                      <th className="py-3 px-4 text-center w-[150px]">Status</th>
                      <th className="py-3 px-4 text-center w-[150px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStories.map(story => (
                      <tr key={story._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{story.Name}</span>
                              {story.Description && (
                                <span className="text-sm text-gray-500">{story.Description}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(story.CreatedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {(() => {
                            const status = getTaskStatusStyle(story.Status);
                            const StatusIcon = status.icon;
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-gradient-to-r ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                                <StatusIcon className={status.iconColor} size={14} />
                                {getTaskStatusText(story.Status)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {/* TODO: Implement edit */}}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200"
                              title="Edit User Story"
                            >
                              <FaCog size={14} />
                            </button>
                            <button
                              onClick={() => {/* TODO: Implement delete */}}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-red-100 text-red-700 hover:bg-red-200"
                              title="Delete User Story"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Table - Keep it full width below */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
            </div>
            <div className="overflow-x-auto">
              {taskList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50">
                  No tasks for this project.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">Assigned To</th>
                      <th className="py-3 px-4 text-left">Assignee</th>
                      <th className="py-3 px-4 text-center">Date Assigned</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskList.map(task => (
                      <tr key={task._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{task.Name}</span>
                            <span className="text-xs text-gray-500">{task.Description}</span>
                            {/* <span className="text-xs text-blue-600">{task.Type}</span> */}
                          </div>
                        </td>
                        {task.AssignedTo && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                {task.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">{task.AssignedToDetails.fullName}</span>
                                {/* {task.AssignedToDetails.email && (
                                  <span className="text-sm text-gray-500">{task.AssignedToDetails.email}</span>
                                )} */}
                                {task.AssignedToDetails.teamName && (
                                  <span className="text-sm text-gray-500">{task.AssignedToDetails.teamName}</span>
                                )}
                              </div>
                            </div>
                          </td>
                        )}
                        {task.Assignee && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                {task.AssigneeDetails.fullName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">{task.AssigneeDetails.fullName}</span>
                                {/* {task.AssigneeDetails.email && (
                                  <span className="text-sm text-gray-500">{task.AssigneeDetails.email}</span>
                                )} */}
                                {task.AssigneeDetails.teamName && (
                                  <span className="text-sm text-gray-500">{task.AssigneeDetails.teamName}</span>
                                )}
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-4 text-center">
                          {task.AssignedDate ? new Date(task.AssignedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {(() => {
                            const status = getTaskStatusStyle(task.Status);
                            const StatusIcon = status.icon;
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-gradient-to-r ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                                <StatusIcon className={status.iconColor} size={14} />
                                {getTaskStatusText(task.Status)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {/* TODO: Implement edit */ }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Task"
                            >
                              <FaCog size={16} />
                            </button>
                            <button
                              onClick={() => {/* TODO: Implement delete */ }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Task"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
              )}
            </div>
          </div>
        </div>

        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Project Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes size={20} />
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Status</label>
                  <select
                    value={settingsForm.ProjectStatusID}
                    onChange={e => setSettingsForm(f => ({ ...f, ProjectStatusID: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    {projectStatuses.map(status => (
                      <option key={status.Code} value={status.Code}>
                        {status.Value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={handleToggleProjectStatus}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${project.IsActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    disabled={togglingStatus}
                  >
                    {togglingStatus ? 'Updating...' : project.IsActive ? 'Mark In Active' : 'Mark Active'}
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
        <AddTaskModal
          isOpen={isAddTaskOpen}
          onClose={() => setIsAddTaskOpen(false)}
          onAddTask={handleAddTask}
          mode="fromProject"
          projectIdDefault={projectId}
          userStories={userStories}
        />
      </div>
    </Layout>
  );
}

export default ProjectDetailsPage;
