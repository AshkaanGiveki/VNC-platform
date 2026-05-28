import apiClient from './apiClient';

export const getOrganizations = (params) => apiClient.get('/organizations', { params });
export const getOrganization = (id) => apiClient.get(`/organizations/${id}`);
export const createOrganization = (data) => apiClient.post('/organizations', data);
export const updateOrganization = (id, data) => apiClient.put(`/organizations/${id}`, data);
export const deleteOrganization = (id) => apiClient.delete(`/organizations/${id}`);