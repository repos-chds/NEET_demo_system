import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Endpoints that should NOT trigger token refresh or redirect
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/me', '/auth/logout'];

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // Don't intercept auth endpoints — let them fail naturally
    if (AUTH_ENDPOINTS.some((ep) => requestUrl.includes(ep))) {
      return Promise.reject(error);
    }

    // If 401 on a normal API call and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
