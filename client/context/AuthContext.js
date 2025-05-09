import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to login',
      };
    }
  };

  // Register new user
  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to register',
      };
    }
  };

  // Google login
  const googleLogin = async (credential) => {
    try {
      const data = await authService.googleLogin(credential);
      setUser(data);
      return { 
        success: true,
        needsAdditionalDetails: data.needsAdditionalDetails || false
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to login with Google',
      };
    }
  };

  // Complete user profile
  const completeProfile = async (profileData) => {
    try {
      const data = await authService.completeProfile(profileData);
      setUser(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to complete profile',
      };
    }
  };

  // Logout
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        completeProfile,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext; 