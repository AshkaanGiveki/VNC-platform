import apiClient from './apiClient';

export const getImages = (params) => apiClient.get('/images', { params });
export const getImage = (id) => apiClient.get(`/images/${id}`);
export const createImage = (data) => apiClient.post('/images', data);
export const updateImage = (id, data) => apiClient.put(`/images/${id}`, data);
export const toggleImage = (id) => apiClient.patch(`/images/${id}/toggle`);
export const getEnabledImages = () => apiClient.get('/images', { params: { isEnabled: true, limit: 100 } });