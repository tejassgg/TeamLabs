import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempAuthData, setTempAuthData] = useState(null);

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
      if (data.twoFactorEnabled) {
        // Store temporary auth data for 2FA verification
        setTempAuthData({
          userId: data.userId
        });
        return { 
          success: true, 
          twoFactorEnabled: true 
        };
      }
      setUser(data);
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message || 'Failed to login',
      };
    }
  };

  // Verify 2FA during login
  const verifyLogin2FA = async (code) => {
    try {
      if (!tempAuthData) {
        throw new Error('No pending 2FA verification');
      }
      const data = await authService.verifyLogin2FA(code, tempAuthData.userId);
      setUser(data);
      setTempAuthData(null);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to verify 2FA code',
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

  // Update user data
  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyLogin2FA,
        register,
        googleLogin,
        completeProfile,
        logout,
        updateUser,
        isAuthenticated: !!user,
        tempAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext; 