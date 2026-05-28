import apiClient from './apiClient';

export const startSession = (workspaceId) => apiClient.post('/sessions/start', { workspaceId });
export const getUserSessions = (params) => apiClient.get('/sessions', { params });
export const getSession = (id) => apiClient.get(`/sessions/${id}`);
export const stopSession = (id) => apiClient.post(`/sessions/${id}/stop`);
export const pauseSession = (id) => apiClient.post(`/sessions/${id}/pause`);
export const resumeSession = (id) => apiClient.post(`/sessions/${id}/resume`);
export const getOrgSessions = (orgId, params) => apiClient.get(`/organizations/${orgId}/sessions`, { params });