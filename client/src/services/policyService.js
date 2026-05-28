import apiClient from './apiClient';

export const getTemplates = (orgId) => apiClient.get(`/organizations/${orgId}/policies`);
export const createTemplate = (orgId, data) => apiClient.post(`/organizations/${orgId}/policies`, data);
export const updateTemplate = (orgId, id, data) => apiClient.put(`/organizations/${orgId}/policies/${id}`, data);
export const deleteTemplate = (orgId, id) => apiClient.delete(`/organizations/${orgId}/policies/${id}`);
export const setDefaultTemplate = (orgId, id) => apiClient.post(`/organizations/${orgId}/policies/${id}/set-default`);