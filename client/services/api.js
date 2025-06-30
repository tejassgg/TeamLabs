import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance for authenticated requests
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for public endpoints (like 2FA verification)
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token only for authenticated requests
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
      usernameOrEmail = usernameOrEmail.toLowerCase();
      const response = await api.post('/auth/login', { usernameOrEmail, password });
      // Don't set token or user data yet if 2FA is required
      if (response.data.twoFactorEnabled) {
        return {
          twoFactorEnabled: response.data.twoFactorEnabled,
          userId: response.data.userId
        };
      }
      // If no 2FA required, proceed with normal login
      if (response.data.token) {
        Cookies.set('token', response.data.token, { expires: 30 });
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'An error occurred during login' };
    }
  },

  // Verify 2FA code during login - using publicApi to avoid token requirement
  verifyLogin2FA: async (code, userId) => {
    try {
      const response = await api.post('/auth/2fa/verify-login', { code, userId });

      if (response.status === 200) {
        if (response.data.token) {
          Cookies.set('token', response.data.token, { expires: 30 });
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      }
      return response.data;

    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify 2FA code' };
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
        // Store user data including security settings from login response
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

  completeProfile: async (profileData) => {
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

  getUserActivities: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/auth/activities?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
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

  generate2FA: async (userId) => {
    try {
      const response = await api.post('/auth/2fa/generate', { userId: userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate 2FA' };
    }
  },

  verify2FA: async (token) => {
    try {
      const response = await api.post('/auth/2fa/verify', { token });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify 2FA' };
    }
  },

  disable2FA: async () => {
    try {
      const response = await api.post('/auth/2fa/disable');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to disable 2FA' };
    }
  },

  updateSecuritySettings: async (securitySettings) => {
    try {
      const response = await api.put('/auth/security-settings', securitySettings);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update security settings' };
    }
  },

  updateUserStatus: async (status, userId) => {
    try {
      const response = await api.put('/auth/status', { status, userId});
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user status' };
    }
  }
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
  },
  getProjectStatuses: async () => {
    try {
      const response = await api.get('/common-types/project-statuses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch project statuses' };
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
  },
  updateProject: async (projectId, updateData) => {
    try {
      const response = await api.patch(`/projects/${projectId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update project' };
    }
  },
  getProjectDetails: async (projectId) => {
    try {
      const response = await api.get(`/project-details/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch project details' };
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
  },
  getTaskDetails: async (projectId) => {
    try {
      const response = await api.get(`/task-details/project/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch project tasks' };
    }
  },
  updateTaskStatus: async (taskId, newStatus) => {
    try {
      const response = await api.patch(`/task-details/${taskId}/status`, { Status: newStatus });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update task status' };
    }
  },
  getTeamMembersByProject: async (projectId) => {
    try {
      const response = await api.get(`/task-details/project/${projectId}/team-members`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch team members' };
    }
  },
  assignTask: async (taskId, userId) => {
    try {
      const response = await api.patch(`/task-details/${taskId}/assign`, { AssignedTo: userId, AssignedDate: new Date() });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign task' };
    }
  },
  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/task-details/${taskId}/delete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove task' };
    }
  },
  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.patch(`/task-details/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update task' };
    }
  },
  bulkDeleteTasks: async (taskIds) => {
    try {
      const response = await api.delete('/task-details/bulk-delete', { data: { taskIds } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete tasks' };
    }
  }
};

export const chatbotService = {
  // Send a message to the chatbot
  sendMessage: async (message, isAuthenticated = false) => {
    try {
      const endpoint = isAuthenticated ? '/chatbot' : '/chatbot/greet';
      const response = await api.post(endpoint, { message });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message to chatbot' };
    }
  },

  // Get conversation history
  getConversationHistory: async (page = 1, limit = 5) => {
    try {
      const response = await api.get('/chatbot/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch conversation history' };
    }
  }
};

export default api; 
