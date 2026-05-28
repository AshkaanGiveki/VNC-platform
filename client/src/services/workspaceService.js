import apiClient from './apiClient';

export const getWorkspaces = (orgId, params) => apiClient.get(`/organizations/${orgId}/workspaces`, { params });
export const getWorkspace = (orgId, id) => apiClient.get(`/organizations/${orgId}/workspaces/${id}`);
export const createWorkspace = (orgId, data) => apiClient.post(`/organizations/${orgId}/workspaces`, data);
export const updateWorkspace = (orgId, id, data) => apiClient.put(`/organizations/${orgId}/workspaces/${id}`, data);
export const deleteWorkspace = (orgId, id) => apiClient.delete(`/organizations/${orgId}/workspaces/${id}`);
export const assignWorkspace = (orgId, id, userId) => apiClient.post(`/organizations/${orgId}/workspaces/${id}/assign`, { userId });
export const revokeWorkspace = (orgId, id, userId) => apiClient.delete(`/organizations/${orgId}/workspaces/${id}/assign/${userId}`);
export const getMyWorkspaces = (orgId) => apiClient.get(`/organizations/${orgId}/users/me/workspaces`);