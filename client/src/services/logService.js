import apiClient from './apiClient';

export const getLogs = (params) => apiClient.get('/logs', { params });