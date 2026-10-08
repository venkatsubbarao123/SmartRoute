import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartroute_token'));
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('smartroute_user');
    const storedToken = localStorage.getItem('smartroute_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        localStorage.removeItem('smartroute_user');
        localStorage.removeItem('smartroute_token');
      }
    }
    setLoading(false);
  }, []);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user || res.data);
          localStorage.setItem('smartroute_user', JSON.stringify(res.data.user || res.data));
        })
        .catch(() => {
          localStorage.removeItem('smartroute_token');
          localStorage.removeItem('smartroute_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('smartroute_token', newToken);
      localStorage.setItem('smartroute_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      toast.success(`Welcome back, ${newUser.name}! 🎉`);
      return { success: true, user: newUser };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('smartroute_token', newToken);
      localStorage.setItem('smartroute_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      toast.success(`Welcome to SmartRoute, ${newUser.name}! 🚀`);
      return { success: true, user: newUser };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('smartroute_token');
    localStorage.removeItem('smartroute_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('smartroute_user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
