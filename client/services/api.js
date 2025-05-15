import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  // Login with username/email and password
  login: async (usernameOrEmail, password) => {
    try {
      const response = await api.post('/auth/login', { usernameOrEmail, password });
      if (response.data.token) {
        Cookies.set('token', response.data.token, { expires: 30 });
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'An error occurred during login' };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        Cookies.set('token', response.data.token, { expires: 30 });
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'An error occurred during registration' };
    }
  },

  // Google login
  googleLogin: async (credential) => {
    try {
      const response = await api.post('/auth/google', { credential });
      if (response.data.token) {
        Cookies.set('token', response.data.token, { expires: 30 });
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'An error occurred during Google login' };
    }
  },

  // Logout
  logout: async () => {
    try {
      // Log the logout activity before clearing the session
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error logging logout activity:', error);
    } finally {
      Cookies.remove('token');
      localStorage.removeItem('user');
      // Optionally redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  // Get current user
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('user'));
    }
    return null;
  },

  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user profile' };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = Cookies.get('token');
    return !!token;
  },

  async completeProfile(profileData) {
    try {
      const response = await api.put('/auth/complete-profile', profileData);
      // Update localStorage with the new user data
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          ...response.data,
          token: currentUser.token // Preserve the token
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete profile' };
    }
  },

  getUserActivities: async (page = 1, limit = 5) => {
    try {
      const response = await api.get('/auth/activities', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching user activities' };
    }
  },

  getUserOrganizations: async () => {
    try {
      const response = await api.get('/auth/organizations');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user organizations' };
    }
  },
};

export const teamService = {
  getTeams: async (role, userId) => {
    try {
      const response = await api.get(`/teams/${role}/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch teams' };
    }
  },
  addTeam: async (teamData) => {
    try {
      const response = await api.post('/teams', teamData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add team' };
    }
  },
  deleteTeam: async (teamId, userId) => {
    try {
      const response = await api.delete(`/teams/${teamId}`, { data: { userId } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete team' };
    }
  }
};

export const commonTypeService = {
  getTeamTypes: async () => {
    try {
      const response = await api.get('/common-types/team-types');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch team types' };
    }
  },
  getOrganizations: async () => {
    try {
      const response = await api.get('/common-types/organizations');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch organizations' };
    }
  },
  getUserRoles: async () => {
    try {
      const response = await api.get('/common-types/user-roles');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user roles' };
    }
  },
  getPhoneExtensions: async () => {
    try {
      const response = await api.get('/common-types/phone-extensions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch phone extensions' };
    }
  },
  getTaskTypes: async () => {
    try {
      const response = await api.get('/common-types/task-types');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch task types' };
    }
  }
};

export const projectService = {
  getProjects: async (userId, type) => {
    try {
      const response = await api.get(`/projects/${userId}/${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch projects' };
    }
  },
  addProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add project' };
    }
  }
};

export const taskService = {
  addTaskDetails: async (taskData, mode) => {
    try {
      const response = await api.post('/task-details', { taskDetail: taskData, mode: mode });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add task' };
    }
  },
  getAllTaskDetails: async () => {
    try {
      const response = await api.get('/task-details');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch tasks' };
    }
  }
};

export default api; 