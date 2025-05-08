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
  // Login with email and password
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
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
  logout: () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    // Optionally redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
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
};

export default api; 