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
  googleLogin: async (credential, inviteToken = null) => {
    try {
      const response = await api.post('/auth/google', { credential, inviteToken });
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

  updateUserSettings: async (userSettings) => {
    try {
      const response = await api.put('/auth/user-settings', userSettings);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user settings' };
    }
  },
  
  updateUserStatus: async (status, userId) => {
    try {
      const response = await api.put('/auth/status', { status, userId});
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user status' };
    }
  },
  
  forgotPassword: async (usernameOrEmail) => {
    try {
      const response = await api.post('/auth/forgot-password', { usernameOrEmail });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reset link' };
    }
  },
  resetPassword: async (key, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { key, newPassword });
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  },
  verifyResetPassword: async (key) => {
    try {
      const response = await api.post('/auth/verify-reset-password', { key });
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify reset password' };
    }
  },
  getUserOverview: async () => {
    try {
      const response = await api.get('/users/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user overview' };
    }
  },

  updateOnboardingStatus: async (completed = true, step = null, progress = null) => {
    try {
      debugger;
      const response = await api.put('/auth/onboarding', { completed, step, progress });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update onboarding status' };
    }
  },

  // GitHub Integration methods
  initiateGitHubAuth: async (userId) => {
    try {
      const response = await api.post('/auth/github/initiate', { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to initiate GitHub authentication' };
    }
  },

  handleGitHubCallback: async (code, state, userId) => {
    try {
      const response = await api.post('/auth/github/callback', { userId }, {
        params: { code, state }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete GitHub authentication' };
    }
  },

  disconnectGitHub: async (userId) => {
    try {
      const response = await api.post('/auth/github/disconnect', { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to disconnect GitHub account' };
    }
  },

  getGitHubStatus: async (userId) => {
    try {
      const response = await api.get(`/auth/github/status/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get GitHub status' };
    }
  },

  getIntegrationsStatus: async (userId) => {
    try {
      const response = await api.get(`/auth/integrations/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get integrations status' };
    }
  },

  getSubscriptionData: async (organizationID) => {
    try {
      const response = await api.get(`/payment/organization/${organizationID}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subscription data' };
    }
  },

  // Payments - Subscription management
  calculateRefund: async (organizationID, newPlan) => {
    try {
      const response = await api.get(`/payment/calculate-refund/${organizationID}?newPlan=${encodeURIComponent(newPlan)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to calculate refund' };
    }
  },

  downgradeSubscription: async (organizationID, newPlan, userId) => {
    try {
      const response = await api.post(`/payment/downgrade/${organizationID}`, { newPlan, userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to downgrade subscription' };
    }
  },

  upgradeSubscription: async (organizationID, userId) => {
    try {
      const response = await api.post(`/payment/upgrade/${organizationID}`, { newPlan: 'annual', userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upgrade subscription' };
    }
  },
  cancelSubscription: async (organizationID, userId) => {
    try {
      const response = await api.post(`/payment/cancel/${organizationID}`, { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel subscription' };
    }
  },

  // GitHub Repository methods
  getUserRepositories: async (userId) => {
    try {
      const response = await api.get(`/auth/github/repositories/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user repositories' };
    }
  },

  linkRepositoryToProject: async (projectId, repositoryData) => {
    try {
      const response = await api.post(`/projects/${projectId}/github/link`, { repositoryData });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to link repository to project' };
    }
  },

  unlinkRepositoryFromProject: async (projectId) => {
    try {
      const response = await api.post(`/projects/${projectId}/github/unlink`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to unlink repository from project' };
    }
  },

  getProjectRepository: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/github/repository`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get project repository' };
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
  getTeamsOverview: async (userId) => {
    try {
      const response = await api.get(`/teams/overview/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch teams overview' };
    }
  },
  getTeamsByOrganization: async (organizationId) => {
    try {
      const response = await api.get(`/teams/organization/${organizationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch teams by organization' };
    }
  },
  addTeam: async (teamData) => {
    try {
      const response = await api.post('/teams', teamData);
      return response.data;
    } catch (error) {
      throw error.response?.data;
    }
  },
  deleteTeam: async (teamId, userId) => {
    try {
      const response = await api.delete(`/teams/${teamId}`, { data: { userId } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete team' };
    }
  },
  requestToJoinTeam: async (teamId, userId) => {
    try {
      const response = await api.post(`/teams/${teamId}/join-request`, { userId });
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to request to join team' };
    }
  },
  getTeamJoinRequests: async (teamId) => {
    try {
      const response = await api.get(`/teams/${teamId}/join-requests`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch join requests' };
    }
  },
  acceptTeamJoinRequest: async (teamId, requestId, adminId) => {
    try {
      const response = await api.post(`/teams/${teamId}/join-requests/${requestId}/accept`, { adminId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to accept join request' };
    }
  },
  rejectTeamJoinRequest: async (teamId, requestId, adminId) => {
    try {
      const response = await api.post(`/teams/${teamId}/join-requests/${requestId}/reject`, { adminId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject join request' };
    }
  },
  getUserPendingRequests: async (userId) => {
    try {
      const response = await api.get(`/teams/user/${userId}/pending-requests`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pending requests' };
    }
  },
  leaveTeam: async (teamId, userId, newAdminId = null) => {
    try {
      const response = await api.post(`/teams/${teamId}/leave`, { 
        userId, 
        ...(newAdminId && { newAdminId })
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to leave team' };
    }
  },
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
  },
  getDropdownData: async () => {
    try {
      const response = await api.get('/common-types/dropdown-data');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dropdown data' };
    }
  },
  // (Removed) standalone subscription price getters; use getSubscriptionCatalog instead
  getSubscriptionCatalog: async () => {
    try {
      const response = await api.get('/common-types/subscription-catalog');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subscription catalog' };
    }
  }
};

export const organizationService = {
  createOrganization: async (orgData) => {
    try {
      const response = await api.post('/organizations', orgData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create organization' };
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
  getProjectsOverview: async (userId) => {
    try {
      const response = await api.get(`/projects/overview/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch projects overview' };
    }
  },
  addProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      throw error.response?.data;
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
      throw error.response?.data;
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
  getKanbanData: async (projectId) => {
    try {
      const response = await api.get(`/task-details/project/${projectId}/kanban`);
      return response.data; // { tasks, userStories }
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch kanban data' };
    }
  },
  getTaskById: async (taskId) => {
    try {
      const response = await api.get(`/task-details/${taskId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch task details' };
    }
  },
  updateTaskStatus: async (taskId, newStatus, modifiedBy) => {
    try {
      const response = await api.patch(`/task-details/${taskId}/status`, { Status: newStatus, modifiedBy: modifiedBy });
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
      const currentUser = authService.getCurrentUser();
      const response = await api.patch(`/task-details/${taskId}/assign`, { 
        AssignedTo: userId,
        AssignedDate: userId ? new Date() : null,
        assignedBy: currentUser?._id,
      });
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
  },
  getTaskActivity: async (taskId, page = 1, limit = 5) => {
    try {
      const response = await api.get(`/task-details/${taskId}/activity?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch task activity' };
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

export const subtaskService = {
  // Get all subtasks for a task
  getSubtasks: async (taskId) => {
    const res = await api.get(`/subtasks/${taskId}`);
    return res.data;
  },

  // Create a new subtask
  createSubtask: async (subtaskData) => {
    const res = await api.post('/subtasks', subtaskData);
    return res.data;
  },

  // Update a subtask
  updateSubtask: async (subtaskId, updates) => {
    const res = await api.put(`/subtasks/${subtaskId}`, updates);
    return res.data;
  },

  // Toggle subtask completion status
  toggleSubtask: async (subtaskId) => {
    const res = await api.patch(`/subtasks/${subtaskId}/toggle`);
    return res.data;
  },

  // Delete a subtask
  deleteSubtask: async (subtaskId) => {
    const res = await api.delete(`/subtasks/${subtaskId}`);
    return res.data;
  }
};

export const attachmentService = {
  getAttachments: async (taskId) => {
    try {
      const res = await api.get(`/attachments/tasks/${taskId}/attachments`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attachments' };
    }
  },
  getAttachment: async (attachmentId) => {
    try {
      const res = await api.get(`/attachments/${attachmentId}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attachment' };
    }
  },
  uploadAttachment: async (formData) => {
    try {
      const res = await api.post('/upload/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error) {
      console.log('File Upload API Call Error', error);
      throw error.response?.data || { message: 'Failed to upload attachment' };
    }
  },
  addAttachment: async (taskId, filename, fileUrl, uploadedBy, fileSize) => {
    try {
      const res = await api.post(`/attachments/tasks/${taskId}/attachments`, { 
        Filename: filename, 
        FileURL: fileUrl, 
        UploadedBy: uploadedBy,
        FileSize: fileSize
      });
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add attachment' };
    }
  },
  addProjectAttachment: async (projectId, filename, fileUrl, uploadedBy, fileSize) => {
    try {
      const res = await api.post(`/attachments/project/${projectId}/attachments`, { 
        Filename: filename, 
        FileURL: fileUrl, 
        UploadedBy: uploadedBy,
        FileSize: fileSize
      });
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add project attachment' };
    }
  },
  updateAttachment: async (attachmentId, updateData) => {
    try {
      const res = await api.patch(`/attachments/${attachmentId}`, updateData);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update attachment' };
    }
  },
  deleteAttachment: async (attachmentId) => {
    try {
      const res = await api.delete(`/attachments/${attachmentId}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete attachment' };
    }
  },
  bulkDeleteAttachments: async (attachmentIds) => {
    try {
      const res = await api.delete('/attachments/bulk-delete', { data: { attachmentIds } });
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete attachments' };
    }
  }
};

export const commentService = {
  getComments: async (taskId) => {
    const res = await api.get(`/tasks/${taskId}/comments`);
    return res.data;
  },
  addComment: async (taskId, author, content) => {
    const res = await api.post(`/tasks/${taskId}/comments`, { Author: author, Content: content });
    return res.data;
  },
  updateComment: async (commentId, update) => {
    const res = await api.patch(`/comments/${commentId}`, update);
    return res.data;
  },
  deleteComment: async (commentId) => {
    const res = await api.delete(`/comments/${commentId}`);
    return res.data;
  }
};

export const taskDetailsService = {
  getFullTaskDetails: async (taskId) => {
    const res = await api.get(`/task-details/${taskId}/full`);
    return res.data;
  }
};

export const landingService = {
  // Get landing page statistics
  getStats: async () => {
    try {
      const response = await publicApi.get('/landing/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch landing statistics' };
    }
  },

  // Get active teams for landing page
  getActiveTeams: async (limit = 10) => {
    try {
      const response = await publicApi.get(`/landing/active-teams?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch active teams' };
    }
  },

  // Get completed projects for landing page
  getCompletedProjects: async (limit = 10) => {
    try {
      const response = await publicApi.get(`/landing/completed-projects?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch completed projects' };
    }
  },

  // Get comprehensive landing page overview
  getOverview: async () => {
    try {
      const response = await publicApi.get('/landing/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch landing overview' };
    }
  }
};

export const userService = {
  // Get user's usage limits and premium status
  getUserUsageLimits: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/usage-limits`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user usage limits' };
    }
  },
  inviteUser: async (email) => {
    try {
      const response = await api.post('/users/invite', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send invite' };
    }
  },
  getInvites: async () => {
    try {
      const response = await api.get('/users/invites');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch invites' };
    }
  },
  resendInvite: async (inviteId) => {
    try {
      const response = await api.post(`/users/invites/${inviteId}/resend`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to resend invite' };
    }
  },
  deleteInvite: async (inviteId) => {
    try {
      const response = await api.delete(`/users/invites/${inviteId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete invite' };
    }
  }
};

export const messagingService = {
  getConversations: async (includeArchived = false) => {
    const res = await api.get('/messages/conversations', { params: { includeArchived } });
    return res.data;
  },
  getArchivedConversations: async () => {
    const res = await api.get('/messages/conversations/archived');
    return res.data;
  },
  getOrCreateDirectConversation: async (userId) => {
    const res = await api.post(`/messages/conversations/with/${userId}`);
    return res.data;
  },
  createGroup: async (name, participantIds, avatarUrl) => {
    const res = await api.post('/messages/conversations', { name, participantIds, avatarUrl });
    return res.data;
  },
  getMessages: async (conversationId, page = 1, limit = 30) => {
    const res = await api.get(`/messages/conversations/${conversationId}/messages`, { params: { page, limit } });
    return res.data;
  },
  getConversation: async (conversationId) => {
    const res = await api.get(`/messages/conversations/${conversationId}`);
    return res.data;
  },
  markRead: async (conversationId) => {
    const res = await api.post(`/messages/conversations/${conversationId}/read`);
    return res.data;
  },
  addMembers: async (conversationId, memberIds) => {
    const res = await api.post(`/messages/conversations/${conversationId}/members`, { memberIds });
    return res.data;
  },
  removeMembers: async (conversationId, memberIds) => {
    const res = await api.delete(`/messages/conversations/${conversationId}/members`, { data: { memberIds } });
    return res.data;
  },
  leaveConversation: async (conversationId) => {
    const res = await api.post(`/messages/conversations/${conversationId}/leave`);
    return res.data;
  },
  getConversationStats: async (conversationId) => {
    const res = await api.get(`/messages/conversations/${conversationId}/stats`);
    return res.data;
  },
  archiveConversation: async (conversationId) => {
    const res = await api.post(`/messages/conversations/${conversationId}/archive`);
    return res.data;
  },
  getAssets: async (conversationId) => {
    const res = await api.get(`/messages/conversations/${conversationId}/assets`);
    return res.data;
  },
  sendMessage: async (conversationId, payload) => {
    const res = await api.post(`/messages/conversations/${conversationId}/messages`, payload);
    return res.data;
  },
  react: async (messageId, emoji) => {
    const res = await api.post(`/messages/messages/${messageId}/reactions`, { emoji });
    return res.data;
  },
  uploadChatMedia: async (formData) => {
    // Stream directly to Next.js local API to save in client/public/uploads
    // Expecting formData to contain a single 'file' entry
    let file = formData.get('file');
    if (!file) throw { message: 'No file provided' };

    // Note: Client-side transcoding removed. Files are uploaded as-is.

    // Convert to ArrayBuffer/Buffer to stream
    let arrayBuffer;
    if (file.arrayBuffer) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      // Fallback for Blob polyfills
      arrayBuffer = await new Response(file).arrayBuffer();
    }
    const filename = formData.get('filename') || file.name || `upload-${Date.now()}`;

    const uploadUrl = '/api/local-upload?filename=' + encodeURIComponent(filename);
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: arrayBuffer,
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw data || { message: 'Upload failed' };
    }
    // Return unified shape { url }
    return { url: data.url };
  },
  deleteConversation: async (conversationId) => {
    const res = await api.delete(`/messages/conversations/${conversationId}`);
    return res.data;
  },
};

export const githubService = {
  // Get project commits
  getProjectCommits: async (projectId, page = 1, perPage = 20) => {
    try {
      const response = await api.get(`/projects/${projectId}/github/commits`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch commits' };
    }
  },
  
  // Get project issues
  getProjectIssues: async (projectId, page = 1, perPage = 20) => {
    try {
      const response = await api.get(`/projects/${projectId}/github/issues`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch issues' };
    }
  }
};

// Meetings service
export const meetingService = {
  listTeamMeetings: async (teamId) => {
    const res = await api.get(`/teams/${teamId}/meetings`);
    return res.data;
  },
  getMeeting: async (meetingId) => {
    const res = await api.get(`/meetings/${meetingId}`);
    return res.data;
  },
  createMeeting: async (teamId, payload) => {
    const res = await api.post(`/teams/${teamId}/meetings`, payload);
    return res.data;
  },
  updateMeeting: async (meetingId, payload) => {
    const res = await api.put(`/meetings/${meetingId}`, payload);
    return res.data;
  },
  deleteMeeting: async (meetingId) => {
    const res = await api.delete(`/meetings/${meetingId}`);
    return res.data;
  },
  initiateGoogleAuth: async (service, returnUrl) => {
    const res = await api.post(`/google/initiate`, { service, returnUrl });
    return res.data;
  },
  getGoogleCalendarStatus: async (userId) => {
    const res = await api.get(`/google-calendar/status/${userId}`);
    return res.data;
  },
  attachGoogleCalendarToken: async ({ accessToken, refreshToken, tokenExpiry }) => {
    const res = await api.post(`/google-calendar/attach-token`, {
      accessToken,
      refreshToken,
      tokenExpiry
    });
    return res.data;
  },
  disconnectGoogleCalendar: async () => {
    const res = await api.post(`/google-calendar/disconnect`, {});
    return res.data;
  },
  getGoogleDriveStatus: async (userId) => {
    const res = await api.get(`/google-drive/status/${userId}`);
    return res.data;
  },
  disconnectGoogleDrive: async () => {
    const res = await api.post(`/google-drive/disconnect`, {});
    return res.data;
  },
  // New method to handle Google Calendar access with client-side tokens
  createMeetingWithGoogleCalendar: async (teamId, payload, accessToken) => {
    const res = await api.post(`/teams/${teamId}/meetings`, {
      ...payload,
      googleAccessToken: accessToken
    });
    return res.data;
  }
};

export const paymentService = {
  createCheckoutSession: async ({ organizationID, userId, plan, priceId, successUrl, cancelUrl }) => {
    try {
      const response = await api.post('/payment/create-checkout-session', {
        organizationID,
        userId,
        plan,
        priceId,
        successUrl,
        cancelUrl,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error.response?.data || { message: 'Failed to create checkout session' };
    }
  },
  createBillingPortalSession: async (organizationID) => {
    try {
      const response = await api.post('/payment/create-billing-portal', { organizationID });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create billing portal session' };
    }
  },
  getCheckoutSession: async (sessionId) => {
    try {
      const response = await api.get(`/payment/checkout-sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch checkout session' };
    }
  },
  confirmCheckoutSession: async (sessionId) => {
    try {
      const response = await api.post('/payment/checkout-sessions/confirm', { sessionId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to confirm checkout session' };
    }
  },
  getStripeTransactions: async (organizationID) => {
    try {
      const response = await api.get(`/payment/organization/${organizationID}/invoices`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch transactions' };
    }
  }
};

// Report services
export const reportService = {
  // Generate a new report
  generateReport: async (projectId, options = {}) => {
    try {
      const response = await api.post('/reports/generate', {
        projectId,
        ...options
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate report' };
    }
  },

  // Get all reports for a user
  getReports: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/reports?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch reports' };
    }
  },

  // Get a specific report
  getReport: async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch report' };
    }
  },

  // Create report configuration
  createConfig: async (configData) => {
    try {
      const response = await api.post('/reports/config', configData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create report configuration' };
    }
  },

  // Get all configurations
  getConfigs: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/reports/configs?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch configurations' };
    }
  },

  // Get specific configuration
  getConfig: async (configId) => {
    try {
      const response = await api.get(`/reports/config/${configId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch configuration' };
    }
  },

  // Update configuration
  updateConfig: async (configId, updates) => {
    try {
      const response = await api.put(`/reports/config/${configId}`, updates);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update configuration' };
    }
  },

  // Delete configuration
  deleteConfig: async (configId) => {
    try {
      const response = await api.delete(`/reports/config/${configId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete configuration' };
    }
  },

  // Submit feedback for a report
  submitFeedback: async (reportId, rating, comments = '') => {
    try {
      const response = await api.post(`/reports/${reportId}/feedback`, {
        rating,
        comments
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit feedback' };
    }
  },

  // Delete a report
  deleteReport: async (reportId) => {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete report' };
    }
  }
};

export default api; 
