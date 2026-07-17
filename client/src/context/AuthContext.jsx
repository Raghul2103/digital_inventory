import React, { createContext, useContext, useState, useEffect } from 'react';
import customFetch from '../services/customFetch';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth session status on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await customFetch.get('/auth/me');
        if (response.data && response.data.success) {
          setUser(response.data.data);
        }
      } catch (err) {
        console.error('Initial session restoration failed:', err.message);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await customFetch.post('/auth/login', { email, password, rememberMe });
      if (response.data && response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.friendlyMessage || 'Invalid email or password'
      };
    }
  };

  const signup = async (name, email, password, roleName) => {
    try {
      const response = await customFetch.post('/auth/signup', { name, email, password, roleName });
      if (response.data && response.data.success) {
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.friendlyMessage || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      await customFetch.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err.message);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin bypass
    return user.permissions && user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
