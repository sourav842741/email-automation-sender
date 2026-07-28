import api from './api.js';

export const createTemplate = (data) => api.post('/templates', data);

export const getTemplates = () => api.get('/templates');

export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data);

export const deleteTemplate = (id) => api.delete(`/templates/${id}`);
