import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { teamService, projectService, authService, taskService, commonTypeService } from '../services/api';
import { getProjectStatusStyle, getProjectStatusBadge } from '../components/ProjectStatusBadge';
import { getTaskTypeStyle, getTaskTypeBadge } from '../components/TaskTypeBadge';
import { getDeadlineStatus, calculateDeadlineText } from '../components/DeadlineStatusBadge';
import { useRouter } from 'next/router';

const GlobalContext = createContext();

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};

export const GlobalProvider = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasksDetails, setTasksDetails] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      const profile = await authService.getUserProfile();
      setUserDetails(profile);
      return profile;
    } catch (err) {
      setError('Failed to fetch user details');
      console.error('Error fetching user details:', err);
      return null;
    }
  };

  // Fetch teams
  const fetchTeams = async (orgId, role, userId) => {
    try {
      const fetchedTeams = await teamService.getTeams(role, userId);
      const filteredTeams = fetchedTeams.filter(team => team.organizationID === orgId);
      setTeams(filteredTeams);
      return filteredTeams;
    } catch (err) {
      setError('Failed to fetch teams');
      console.error('Error fetching teams:', err);
      return [];
    }
  };

  // Fetch projects
  const fetchProjects = async (userId, role) => {
    try {
      const fetchedProjects = await projectService.getProjects(userId, role);
      setProjects(fetchedProjects);
      return fetchedProjects;
    } catch (err) {
      setError('Failed to fetch projects');
      console.error('Error fetching projects:', err);
      return [];
    }
  };

  // Fetch organizations
  const fetchOrganizations = async () => {
    try {
      const orgs = await authService.getUserOrganizations();
      setOrganization(orgs);
      return orgs;
    } catch (err) {
      setError('Failed to fetch organizations');
      console.error('Error fetching organizations:', err);
      return null;
    }
  };

  // Fetch tasks details
  const fetchTasksDetails = async () => {
    try {
      const fetchedTasks = await taskService.getAllTaskDetails();
      setTasksDetails(fetchedTasks);
      return fetchedTasks;
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
      return [];
    }
  };

  // Fetch project statuses
  const fetchProjectStatuses = async () => {
    try {
      const statuses = await commonTypeService.getProjectStatuses();
      setProjectStatuses(statuses);
      return statuses;
    } catch (err) {
      setError('Failed to fetch project statuses');
      console.error('Error fetching project statuses:', err);
      return [];
    }
  };

  // Get project status by code
  const getProjectStatus = (statusCode) => {
    return projectStatuses.find(status => status.Code === statusCode) || { Value: 'Not Assigned', Code: 1 };
  };

  // Get project status badge component
  const getProjectStatusBadgeComponent = (statusCode, showTooltip = true) => {
    const status = getProjectStatus(statusCode);
    return getProjectStatusBadge(status, showTooltip);
  };

  // Get task type style
  const getTaskTypeStyleComponent = (type) => {
    return getTaskTypeStyle(type);
  };

  // Get task type badge component
  const getTaskTypeBadgeComponent = (type) => {
    return getTaskTypeBadge(type);
  };

  // Get task status text
  const getTaskStatusText = (statusCode) => {
    const statusTexts = {
      1: 'Not Assigned',
      2: 'Assigned',
      3: 'In Progress',
      4: 'Development',
      5: 'Testing',
      6: 'QA',
      7: 'Deployment',
      8: 'Completed'
    };
    return statusTexts[statusCode] || 'Unknown';
  };

  // Get deadline status component
  const getDeadlineStatusComponent = (deadlineText) => {
    return getDeadlineStatus(deadlineText);
  };

  // Calculate deadline text component
  const calculateDeadlineTextComponent = (finishDate) => {
    return calculateDeadlineText(finishDate);
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const overview = await authService.getUserOverview();
        if (overview) {          
          setUserDetails(overview.user);
          setTeams(overview.teams);
          setProjects(overview.projects);
          setOrganization(overview.organization);
          setTasksDetails(overview.tasks);
          setProjectStatuses(overview.projectStatuses);
        }
      } catch (err) {
        setError('Failed to fetch user overview');
        console.error('Error initializing data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if not on landing page
    if (user && router.pathname !== '/') {
      initializeData();
    }
  }, [user, router.pathname]);

  const refreshOrganizations = async () => {
    return await fetchOrganizations();
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      const profile = await fetchUserDetails();
      if (profile) {
        await Promise.all([
          fetchTeams(profile.organizationID, profile.role, profile._id),
          fetchProjects(profile._id, profile.role),
          fetchOrganizations()
        ]);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    userDetails,
    teams,
    projects,
    tasksDetails,
    organization,
    projectStatuses,
    loading,
    error,
    refreshOrganizations,
    refreshAll,
    setProjects,
    setTeams,
    setTasksDetails,
    getProjectStatus,
    getProjectStatusStyle,
    getProjectStatusBadgeComponent,
    getTaskTypeStyleComponent,
    getTaskTypeBadgeComponent,
    getTaskStatusText,
    getDeadlineStatusComponent,
    calculateDeadlineTextComponent,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext; 