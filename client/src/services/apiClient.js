import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import store from '../redux/store';
import { setCredentials, logout } from '../redux/slices/authSlice';

// Helper to read a cookie by name
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,                // send cookies automatically
});

// ---------- Request interceptor ----------
apiClient.interceptors.request.use((config) => {
  // Try Redux state first, then fall back to cookie
  const state = store.getState().auth;
  let accessToken = state.accessToken || getCookie('accessToken');
  let csrfToken   = state.csrfToken   || getCookie('csrf-token');

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Attach CSRF header only for state‑changing methods
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  config.headers['Accept-Language'] = 'fa';
  return config;
});

// ---------- Response interceptor (silent refresh) ----------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Get refresh token from Redux or cookie
      const refreshToken =
        store.getState().auth.refreshToken || getCookie('refreshToken');

      if (!refreshToken) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        // Update Redux (which also sets cookies via the authSlice)
        store.dispatch(
          setCredentials({
            ...store.getState().auth,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        );

        // Update cookies manually to be safe
        document.cookie = `accessToken=${newAccessToken}; path=/; max-age=${15 * 60}`;
        document.cookie = `refreshToken=${newRefreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`;

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;