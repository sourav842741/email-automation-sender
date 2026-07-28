import api from './api.js';

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getResume = () => api.get('/resume');

export const deleteResume = () => api.delete('/resume');
