import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { teamService, projectService, authService } from '../services/api';

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
  const [userDetails, setUserDetails] = useState(null);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
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
  const fetchTeams = async (orgId) => {
    try {
      const fetchedTeams = await teamService.getTeams();
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
  const fetchProjects = async (userId) => {
    try {
      const fetchedProjects = await projectService.getProjects(userId, "fetchForUser");
      console.log(fetchedProjects);
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
      setOrganizations(orgs);
      return orgs;
    } catch (err) {
      setError('Failed to fetch organizations');
      console.error('Error fetching organizations:', err);
      return [];
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const profile = await fetchUserDetails();
        if (profile) {
          await Promise.all([
            fetchTeams(profile.organizationID),
            fetchProjects(profile._id),
            fetchOrganizations()
          ]);
        }
      } catch (err) {
        console.error('Error initializing data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initializeData();
    }
  }, [user]);

  const refreshOrganizations = async () => {
    return await fetchOrganizations();
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      const profile = await fetchUserDetails();
      if (profile) {
        await Promise.all([
          fetchTeams(profile.organizationID),
          fetchProjects(profile._id),
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
    organizations,
    loading,
    error,
    refreshOrganizations,
    refreshAll,
    setProjects,
    setTeams
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext; 