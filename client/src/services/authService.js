import apiClient from './apiClient';

export const login = (credentials) => apiClient.post('/auth/login', credentials);
export const refreshToken = (refreshToken) => apiClient.post('/auth/refresh', { refreshToken });
export const logout = () => apiClient.post('/auth/logout');
export const getCsrfToken = () => apiClient.get('/auth/csrf-token');
export const forgotPassword = (email) => apiClient.post('/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) => apiClient.post('/auth/reset-password', { token, newPassword });