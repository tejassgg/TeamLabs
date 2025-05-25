import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import api, { authService, taskService } from '../../services/api';
import Layout from '../../components/Layout';
import { FaTrash, FaCog, FaTimes, FaClock, FaUserCheck, FaSpinner, FaCode, FaVial, FaShieldAlt, FaRocket, FaCheckCircle, FaQuestionCircle, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import LoadingScreen from '../../components/LoadingScreen';
import AddTaskModal from '../../components/AddTaskModal';
import { useToast } from '../../context/ToastContext';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';

const ProjectDetailsPage = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const { theme } = useTheme();
  const { 
    getProjectStatus, 
    getProjectStatusBadgeComponent,
    getTaskTypeBadgeComponent,
    getTaskStatusText,
    getDeadlineStatusComponent,
    calculateDeadlineTextComponent
  } = useGlobal();
  const { showToast } = useToast();
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
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [deletingTask, setDeletingTask] = useState(false);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

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
        setDeadline(calculateDeadlineTextComponent(project.FinishDate));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setDeadline('No Deadline');
    }
  }, [project, calculateDeadlineTextComponent]);

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
      const res = await api.post(`/project-details/${projectId}/add-team`, {
        TeamID: teamId,
        ModifiedBy: currentUser._id
      });

      // Refresh teams and project data
      const projectRes = await api.get(`/project-details/${projectId}`);
      setTeams(projectRes.data.teams);
      // Update project state if status was changed
      if (res.data.statusUpdated) {
        setProject(prev => ({
          ...prev,
          ProjectStatusID: 2 // Update to Assigned status
        }));
      }
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

  const fetchProjectTasks = async () => {
    try {
      const allTasks = await taskService.getTaskDetails();
      setUserStories(allTasks.filter(task => task.ProjectID_FK === projectId && task.Type === 'User Story'));
      setTaskList(allTasks.filter(task => task.ProjectID_FK === projectId && task.Type !== 'User Story'));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectTasks();
    }
  }, [projectId]);

  const handleAddTask = async (taskData) => {
    try {
      await taskService.addTask(taskData);
      showToast('Task added successfully!', 'success');
      // Refresh tasks
      fetchProjectTasks();
    } catch (err) {
      showToast('Failed to add task', 'error');
    }
  };

  // Update the getTaskStatusStyle function to use theme
  const getTaskStatusStyle = (statusCode) => {
    const isDark = theme === 'dark';
    const styles = {
      1: { // Not Assigned
        bgColor: isDark ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50 to-gray-100',
        textColor: isDark ? 'text-gray-300' : 'text-gray-700',
        borderColor: isDark ? 'border-gray-700' : 'border-gray-200',
        icon: FaTimes,
        iconColor: isDark ? 'text-gray-400' : 'text-gray-500'
      },
      2: { // Assigned
        bgColor: isDark ? 'from-blue-900/50 to-blue-800/50' : 'from-blue-50 to-blue-100',
        textColor: isDark ? 'text-blue-300' : 'text-blue-700',
        borderColor: isDark ? 'border-blue-700' : 'border-blue-200',
        icon: FaCheckCircle,
        iconColor: isDark ? 'text-blue-400' : 'text-blue-500'
      },
      3: { // In Progress
        bgColor: isDark ? 'from-yellow-900/50 to-yellow-800/50' : 'from-yellow-50 to-yellow-100',
        textColor: isDark ? 'text-yellow-300' : 'text-yellow-700',
        borderColor: isDark ? 'border-yellow-700' : 'border-yellow-200',
        icon: FaClock,
        iconColor: isDark ? 'text-yellow-400' : 'text-yellow-500'
      },
      4: { // Development
        bgColor: isDark ? 'from-purple-900/50 to-purple-800/50' : 'from-purple-50 to-purple-100',
        textColor: isDark ? 'text-purple-300' : 'text-purple-700',
        borderColor: isDark ? 'border-purple-700' : 'border-purple-200',
        icon: FaCode,
        iconColor: isDark ? 'text-purple-400' : 'text-purple-500'
      },
      5: { // Testing
        bgColor: isDark ? 'from-orange-900/50 to-orange-800/50' : 'from-orange-50 to-orange-100',
        textColor: isDark ? 'text-orange-300' : 'text-orange-700',
        borderColor: isDark ? 'border-orange-700' : 'border-orange-200',
        icon: FaVial,
        iconColor: isDark ? 'text-orange-400' : 'text-orange-500'
      },
      6: { // QA
        bgColor: isDark ? 'from-indigo-900/50 to-indigo-800/50' : 'from-indigo-50 to-indigo-100',
        textColor: isDark ? 'text-indigo-300' : 'text-indigo-700',
        borderColor: isDark ? 'border-indigo-700' : 'border-indigo-200',
        icon: FaShieldAlt,
        iconColor: isDark ? 'text-indigo-400' : 'text-indigo-500'
      },
      7: { // Deployment
        bgColor: isDark ? 'from-pink-900/50 to-pink-800/50' : 'from-pink-50 to-pink-100',
        textColor: isDark ? 'text-pink-300' : 'text-pink-700',
        borderColor: isDark ? 'border-pink-700' : 'border-pink-200',
        icon: FaRocket,
        iconColor: isDark ? 'text-pink-400' : 'text-pink-500'
      },
      8: { // Completed
        bgColor: isDark ? 'from-green-900/50 to-green-800/50' : 'from-green-50 to-green-100',
        textColor: isDark ? 'text-green-300' : 'text-green-700',
        borderColor: isDark ? 'border-green-700' : 'border-green-200',
        icon: FaCheckCircle,
        iconColor: isDark ? 'text-green-400' : 'text-green-500'
      }
    };

    return styles[statusCode] || styles[1];
  };

  // Helper function to get theme-aware classes
  const getThemeClasses = (baseClasses, darkClasses) => {
    return `${baseClasses} ${theme === 'dark' ? darkClasses : ''}`;
  };

  // Update the table container classes
  const tableContainerClasses = getThemeClasses(
    'bg-white rounded-xl shadow-sm border border-gray-200',
    'dark:bg-[#1F1F1F] dark:border-[#424242]'
  );

  const tableHeaderClasses = getThemeClasses(
    'bg-gray-50 border-b border-gray-200',
    'dark:bg-gray-700/50 dark:border-gray-700'
  );

  const tableHeaderTextClasses = getThemeClasses(
    'text-gray-900',
    'dark:text-gray-100'
  );

  const tableRowClasses = getThemeClasses(
    'border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0',
    'dark:border-gray-700 dark:hover:bg-gray-700/50'
  );

  const tableTextClasses = getThemeClasses(
    'text-gray-900',
    'dark:text-gray-100'
  );

  const tableSecondaryTextClasses = getThemeClasses(
    'text-gray-500',
    'dark:text-gray-400'
  );

  // Function to handle task deletion
  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      showToast('Task deleted successfully', 'success');
      // Refresh tasks
      fetchProjectTasks();
    } catch (err) {
      showToast('Failed to delete task: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  // Function to open the delete task confirmation dialog
  const confirmDeleteTask = (task) => {
    setTaskToDelete(task);
    setShowDeleteTaskDialog(true);
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
      <Head>
        <title>Project - {project?.Name || 'Loading...'} | TeamLabs</title>
      </Head>
      <div className="mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <FaChevronRight className="mx-2" size={12} />
          <Link href="/projects" className="hover:text-blue-600 transition-colors">
            Projects
          </Link>
          <FaChevronRight className="mx-2" size={12} />
          <span className="text-gray-700 font-medium">Project Details</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-3xl font-bold pr-8">{project.Name}</h2>
            </div>
            {project && (
              <div>
                {getProjectStatusBadgeComponent(project.ProjectStatusID)}
              </div>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              
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
                const status = getDeadlineStatusComponent(deadline);
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
              className={getThemeClasses(
                'ml-4 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200',
                'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
              )}
              onClick={() => setIsAddTaskOpen(true)}
            >
              + Add Task
            </button>
          )}
        </div>

        {isOwner && (
          <div className="mb-6 flex flex-col gap-2">
            <label className={getThemeClasses(
              'block text-gray-700 font-semibold mb-1',
              'dark:text-gray-200'
            )}>Search for a Team (search by name, description, or TeamID)</label>
            <input
              type="text"
              className={getThemeClasses(
                'border rounded-xl px-4 py-2.5 w-full md:w-96 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
                'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
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
                <ul className={getThemeClasses(
                  'border rounded-xl bg-white max-h-48 overflow-y-auto z-10 shadow-md',
                  'dark:bg-gray-800 dark:border-gray-700'
                )}>
                  {filteredTeams.map((team, index) => (
                    <li
                      key={`${team.TeamID}-${index}`}
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
                            setSelectedTeam(team.TeamID);
                            setSearch(team.TeamName);
                            setIsInputFocused(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <div className={getThemeClasses(
                              'font-medium text-gray-900',
                              'dark:text-gray-100'
                            )}>{team.TeamName}</div>
                            <div className={getThemeClasses(
                              'text-sm text-gray-600',
                              'dark:text-gray-400'
                            )}>{team.TeamDescription}</div>
                            <div className={getThemeClasses(
                              'text-xs text-gray-500 mt-1',
                              'dark:text-gray-500'
                            )}>
                              {team.memberCount || 0} {team.memberCount === 1 ? 'member' : 'members'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddTeam(team.TeamID)}
                          className={getThemeClasses(
                            'ml-2 px-3 py-1.5 text-sm text-white font-medium rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm',
                            'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
                          )}
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
          <div className={tableContainerClasses}>
            <div className={getThemeClasses('p-4 border-b border-gray-200', 'dark:border-gray-700')}>
              <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>Teams Assigned</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={tableHeaderClasses}>
                    <th className={`py-3 px-4 text-left w-[300px] ${tableHeaderTextClasses}`}>Team Name</th>
                    <th className={`hidden md:table-cell py-3 px-4 text-left w-[200px] ${tableHeaderTextClasses}`}>Date Added</th>
                    <th className={`py-3 px-4 text-center w-[150px] ${tableHeaderTextClasses}`}>Status</th>
                    {isOwner && <th className={`py-3 px-4 text-center w-[150px] ${tableHeaderTextClasses}`}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => {
                    const teamDetails = orgTeams.find(t => t.TeamID === team.TeamID);
                    return (
                      <tr key={team.TeamID} className={tableRowClasses}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={getThemeClasses(
                              'w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium',
                              'dark:bg-blue-900/50 dark:text-blue-300'
                            )}>
                              {teamDetails?.TeamName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex flex-col">
                              <span className={tableTextClasses}>{teamDetails?.TeamName || team.TeamID}</span>
                              {teamDetails?.TeamDescription && (
                                <span className={tableSecondaryTextClasses}>{teamDetails.TeamDescription}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`hidden md:table-cell py-3 px-4 ${tableSecondaryTextClasses}`}>
                          {team.CreatedDate ? new Date(team.CreatedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                            team.IsActive
                              ? getThemeClasses(
                                  'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200',
                                  'dark:from-green-900/50 dark:to-green-800/50 dark:text-green-300 dark:border-green-700'
                                )
                              : getThemeClasses(
                                  'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200',
                                  'dark:from-red-900/50 dark:to-red-800/50 dark:text-red-300 dark:border-red-700'
                                )
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              team.IsActive
                                ? getThemeClasses('bg-green-500 animate-pulse', 'dark:bg-green-400')
                                : getThemeClasses('bg-red-500', 'dark:bg-red-400')
                            }`}></span>
                            {team.IsActive ? 'Active' : 'Inactive'}
                          </div>
                        </td>
                        {isOwner && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleToggleTeamStatus(team.TeamID)}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${
                                  team.IsActive
                                    ? getThemeClasses(
                                        'bg-blue-100 text-blue-700 hover:bg-blue-200',
                                        'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                                      )
                                    : getThemeClasses(
                                        'bg-green-100 text-green-700 hover:bg-green-200',
                                        'dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/50'
                                      )
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
                                className={getThemeClasses(
                                  'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                  'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                )}
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
                      <td colSpan={isOwner ? 4 : 3} className={getThemeClasses(
                        'text-center py-8 text-gray-400 bg-gray-50',
                        'dark:text-gray-500 dark:bg-gray-700/50'
                      )}>
                        No teams assigned to this project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Stories Table */}
          <div className={tableContainerClasses}>
            <div className={getThemeClasses('p-4 border-b border-gray-200', 'dark:border-gray-700')}>
              <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>User Stories</h2>
            </div>
            <div className="overflow-x-auto">
              {userStories.length === 0 ? (
                <div className={getThemeClasses(
                  'text-center py-8 text-gray-400 bg-gray-50',
                  'dark:text-gray-500 dark:bg-gray-700/50'
                )}>
                  No user stories for this project.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className={tableHeaderClasses}>
                      <th className={`py-3 px-4 text-left w-[300px] ${tableHeaderTextClasses}`}>Name</th>
                      <th className={`hidden md:table-cell py-3 px-4 text-left w-[200px] ${tableHeaderTextClasses}`}>Date Created</th>
                      <th className={`py-3 px-4 text-center w-[150px] ${tableHeaderTextClasses}`}>Status</th>
                      <th className={`py-3 px-4 text-center w-[150px] ${tableHeaderTextClasses}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStories.map(story => (
                      <tr key={story._id} className={tableRowClasses}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className={tableTextClasses}>{story.Name}</span>
                              {story.Description && (
                                <span className={tableSecondaryTextClasses}>{story.Description}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`hidden md:table-cell py-3 px-4 ${tableSecondaryTextClasses}`}>
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
                              onClick={() => {/* TODO: Implement edit */ }}
                              className={getThemeClasses(
                                'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                                'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                              )}
                              title="Edit User Story"
                            >
                              <FaCog size={14} />
                            </button>
                            <button
                              onClick={() => {/* TODO: Implement delete */ }}
                              className={getThemeClasses(
                                'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-red-100 text-red-700 hover:bg-red-200',
                                'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/50'
                              )}
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
          <div className={tableContainerClasses}>
            <div className={getThemeClasses('p-4 border-b border-gray-200', 'dark:border-gray-700')}>
              <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>Tasks</h2>
            </div>
            <div className="overflow-x-auto">
              {taskList.length === 0 ? (
                <div className={getThemeClasses(
                  'text-center py-8 text-gray-400 bg-gray-50',
                  'dark:text-gray-500 dark:bg-gray-700/50'
                )}>
                  No tasks for this project.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className={tableHeaderClasses}>
                      <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>Name</th>
                      <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>Assigned To</th>
                      <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>Assignee</th>
                      <th className={`hidden md:table-cell py-3 px-4 text-center ${tableHeaderTextClasses}`}>Date Assigned</th>
                      <th className={`hidden md:table-cell py-3 px-4 text-left ${tableHeaderTextClasses}`}>Type</th>
                      <th className={`py-3 px-4 text-center ${tableHeaderTextClasses}`}>Status</th>
                      <th className={`py-3 px-4 text-center ${tableHeaderTextClasses}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskList.map(task => (
                      <tr key={task._id} className={tableRowClasses}>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className={tableTextClasses}>{task.Name}</span>
                            <span className={getThemeClasses(
                              'text-xs text-gray-500',
                              'dark:text-gray-400'
                            )}>{task.Description}</span>
                            {/* Show type badge on mobile */}
                            <div className="md:hidden mt-1">
                              {getTaskTypeBadgeComponent(task.Type)}
                            </div>
                            {/* Show assigned to on mobile if available */}
                            {task.AssignedTo && task.AssignedToDetails && (
                              <div className={getThemeClasses(
                                'md:hidden mt-1 flex items-center gap-1 text-xs text-gray-600',
                                'dark:text-gray-300'
                              )}>
                                <span className="font-medium">Assigned to:</span>
                                <span>{task.AssignedToDetails.fullName}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="hidden md:table-cell py-3 px-4">
                          {task.AssignedTo && task.AssignedToDetails ? (
                            <div className="flex items-center gap-3">
                              <div className={getThemeClasses(
                                'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm',
                                'dark:from-blue-600 dark:to-blue-700'
                              )}>
                                {task.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex flex-col">
                                <span className={tableTextClasses}>{task.AssignedToDetails.fullName}</span>
                                {task.AssignedToDetails.teamName && (
                                  <span className={tableSecondaryTextClasses}>{task.AssignedToDetails.teamName}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className={tableSecondaryTextClasses}>Not Assigned</span>
                            </div>
                          )}
                        </td>
                        <td className="hidden md:table-cell py-3 px-4">
                          {task.Assignee && task.AssigneeDetails ? (
                            <div className="flex items-center gap-3">
                              <div className={getThemeClasses(
                                'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm',
                                'dark:from-blue-600 dark:to-blue-700'
                              )}>
                                {task.AssigneeDetails.fullName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex flex-col">
                                <span className={tableTextClasses}>{task.AssigneeDetails.fullName}</span>
                                {task.AssigneeDetails.teamName && (
                                  <span className={tableSecondaryTextClasses}>{task.AssigneeDetails.teamName}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className={getThemeClasses(
                                'w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-sm',
                                'dark:bg-gray-700 dark:text-gray-400'
                              )}>
                                <span>NA</span>
                              </div>
                              <span className={tableSecondaryTextClasses}>Not Assigned</span>
                            </div>
                          )}
                        </td>
                        <td className={`hidden md:table-cell py-3 px-4 text-center ${tableSecondaryTextClasses}`}>
                          {task.AssignedDate ? new Date(task.AssignedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '-'}
                        </td>
                        <td className="hidden md:table-cell py-3 px-4">
                          {getTaskTypeBadgeComponent(task.Type)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {(() => {
                            const status = getTaskStatusStyle(task.Status);
                            const StatusIcon = status.icon;
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-gradient-to-r ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                                <StatusIcon className={status.iconColor} size={14} />
                                <span className="hidden md:inline">{getTaskStatusText(task.Status)}</span>
                                <span className="md:hidden">{getTaskStatusText(task.Status).substring(0, 3)}</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => confirmDeleteTask(task)}
                              className={getThemeClasses(
                                'p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors',
                                'dark:text-red-400 dark:hover:bg-red-900/30'
                              )}
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Project Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              {project.ModifiedDate && (
                <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                  <FaInfoCircle size={14} />
                  <span>Last Modified: {new Date(project.ModifiedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
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
                    {[1, 2, 3, 4, 5, 6].map(statusCode => {
                      const status = getProjectStatus(statusCode);
                      return (
                        <option key={status.Code} value={status.Code}>
                          {status.Value}
                        </option>
                      );
                    })}
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

        {/* Delete Task Confirmation Dialog */}
        {showDeleteTaskDialog && taskToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className="text-lg font-semibold">
                  Delete Task
                </h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-1">{taskToDelete.Name}</h4>
                  <p className="text-sm text-red-700">{taskToDelete.Description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {getTaskTypeBadgeComponent(taskToDelete.Type)}
                    <span className="text-xs text-red-600">
                      {getTaskStatusText(taskToDelete.Status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteTaskDialog(false);
                    setTaskToDelete(null);
                  }}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTask(taskToDelete.TaskID)}
                  className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center gap-2"
                  disabled={deletingTask}
                >
                  {deletingTask ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FaTrash size={14} />
                      <span>Delete Task</span>
                    </>
                  )}
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
