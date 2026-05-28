import apiClient from './apiClient';

export const getRecordings = (params) => apiClient.get('/recordings', { params });
export const getRecording = (id) => apiClient.get(`/recordings/${id}`);
export const deleteRecording = (id) => apiClient.delete(`/recordings/${id}`);