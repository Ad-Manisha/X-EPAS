import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            const refreshResponse = await authAPI.refreshToken();
            const newToken = refreshResponse.data.access_token;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(refreshResponse.data.user);
          } catch (refreshError) {
            // Refresh failed, clear auth
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (type, identifier, password) => {
    try {
      const loginFunction = type === 'admin' ? authAPI.adminLogin : authAPI.employeeLogin;
      const response = await loginFunction(identifier, password);
      
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await authAPI.logout();
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local auth state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const refreshAuthToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      // Refresh failed, clear auth
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return { success: false };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshAuthToken,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
