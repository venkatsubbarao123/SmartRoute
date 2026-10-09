import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartroute_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      const hadToken = Boolean(localStorage.getItem('smartroute_token'));
      localStorage.removeItem('smartroute_token');
      localStorage.removeItem('smartroute_user');
      localStorage.removeItem('smartroute_active_user');

      // Only redirect if they had a token and are not already on a public view
      if (hadToken && window.location.pathname !== '/' && window.location.pathname !== '/find-route') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
