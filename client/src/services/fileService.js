// import apiClient from './apiClient';

// // Upload a file (multipart/form-data)
// export const uploadFile = (sessionId, formData) =>
//   apiClient.post(`/sessions/${sessionId}/files/upload`, formData, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//   });

// // List uploaded files (MinIO metadata)
// export const getUploads = (sessionId, params) =>
//   apiClient.get(`/sessions/${sessionId}/files/uploads`, { params });

// // Download an uploaded file (redirects to pre‑signed URL)
// export const downloadUploadedFile = (sessionId, fileId) =>
//   apiClient.get(`/sessions/${sessionId}/files/uploads/${fileId}/download`);

// // Delete an uploaded file
// export const deleteUploadedFile = (sessionId, fileId) =>
//   apiClient.delete(`/sessions/${sessionId}/files/uploads/${fileId}`);

// // List files in container's Downloads folder
// export const getDownloads = (sessionId) =>
//   apiClient.get(`/sessions/${sessionId}/files/downloads`);

// // Download a file from container's Downloads folder
// export const downloadContainerFile = (sessionId, fileName) =>
//   `/api/v1/sessions/${sessionId}/files/downloads/${encodeURIComponent(fileName)}`;

import apiClient from './apiClient';

// Upload a file (multipart/form-data)
export const uploadFile = (sessionId, formData) =>
  apiClient.post(`/sessions/${sessionId}/files/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// List uploaded files (MinIO metadata)
export const getUploads = (sessionId, params) =>
  apiClient.get(`/sessions/${sessionId}/files/uploads`, { params });

// Download an uploaded file (returns pre‑signed URL)
export const downloadUploadedFile = (sessionId, fileId) =>
  apiClient.get(`/sessions/${sessionId}/files/uploads/${fileId}/download`);

// Delete an uploaded file
export const deleteUploadedFile = (sessionId, fileId) =>
  apiClient.delete(`/sessions/${sessionId}/files/uploads/${fileId}`);

// List files in container's Downloads folder
export const getDownloads = (sessionId) =>
  apiClient.get(`/sessions/${sessionId}/files/downloads`);

// Download a file from container's Downloads folder – returns the download URL
export const downloadContainerFile = (sessionId, fileName) =>
  `/api/v1/sessions/${sessionId}/files/downloads/${encodeURIComponent(fileName)}`;