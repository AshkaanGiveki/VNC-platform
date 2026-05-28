import apiClient from './apiClient';

export const uploadFile = (sessionId, formData) =>
  apiClient.post(`/sessions/${sessionId}/files/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getSessionFiles = (sessionId, params) =>
  apiClient.get(`/sessions/${sessionId}/files`, { params });

export const downloadFile = (sessionId, fileId) =>
  apiClient.get(`/sessions/${sessionId}/files/${fileId}/download`);

export const deleteFile = (sessionId, fileId) =>
  apiClient.delete(`/sessions/${sessionId}/files/${fileId}`);