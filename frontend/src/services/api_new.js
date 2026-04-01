import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/auth/register/', data),
  getCurrentUser: () => api.get('/auth/me/'),
  // Admin only
  getAllUsers: () => api.get('/auth/admin/users/'),
  createAdminUser: (data) => api.post('/auth/admin/users/', data),
  toggleUserStatus: (userId) => api.post(`/auth/admin/users/${userId}/toggle/`),
  deleteUser: (userId) => api.delete(`/auth/admin/users/${userId}/`),
};

// Student APIs
export const studentAPI = {
  getAll: () => api.get('/students/'),
  getById: (id) => api.get(`/students/${id}/`),
  create: (data) => api.post('/students/', data),
  update: (id, data) => api.put(`/students/${id}/`, data),
  delete: (id) => api.delete(`/students/${id}/`),
  getAccomplishments: (id) => api.get(`/students/${id}/accomplishments/`),
};

// Accomplishment APIs
export const accomplishmentAPI = {
  getAll: (studentId) => api.get('/accomplishments/', { params: { student_id: studentId } }),
  create: (data) => api.post('/accomplishments/', data),
  createBatch: (data) => api.post('/accomplishments/batch', data),
  update: (id, data) => api.put(`/accomplishments/${id}/`, data),
  delete: (id) => api.delete(`/accomplishments/${id}/`),
};

// Prediction APIs
export const predictionAPI = {
  getAll: (studentId) => api.get('/predictions/', { params: { student_id: studentId } }),
  predict: (studentId, modelName = 'default') => 
    api.post('/predictions/predict', { student_id: studentId, model_name: modelName }),
  quickPredict: (accomplishments, modelName = 'default') => 
    api.post('/predictions/quick-predict', { accomplishments, model_name: modelName }),
  delete: (id) => api.delete(`/predictions/${id}/`),
  reset: () => api.delete('/predictions/reset/'),
};

// Model APIs
export const modelAPI = {
  getAll: () => api.get('/models/'),
  getLoaded: () => api.get('/models/loaded'),
  upload: (formData) => api.post('/models/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  load: (id, modelName) => api.post(`/models/${id}/load`, { model_name: modelName }),
  unload: (name) => api.post(`/models/${name}/unload`),
  delete: (id) => api.delete(`/models/${id}/`),
};

export default api;
