import apiClient from './apiClient';

export const getUsers = (orgId, params) => apiClient.get(`/organizations/${orgId}/users`, { params });
export const getUser = (orgId, userId) => apiClient.get(`/organizations/${orgId}/users/${userId}`);
export const createUser = (orgId, data) => apiClient.post(`/organizations/${orgId}/users`, data);
export const updateUser = (orgId, userId, data) => apiClient.put(`/organizations/${orgId}/users/${userId}`, data);
export const deleteUser = (orgId, userId) => apiClient.delete(`/organizations/${orgId}/users/${userId}`);
