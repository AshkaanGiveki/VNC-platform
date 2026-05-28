import apiClient from './apiClient';

export const getNotifications = (params) => apiClient.get('/notifications', { params });
export const markAsRead = (id) => apiClient.patch(`/notifications/${id}/read`);
export const markAllAsRead = () => apiClient.patch('/notifications/read-all');