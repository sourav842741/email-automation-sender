import api from './api.js';

export const saveCoverLetter = (data) => {
  const isFormData = data instanceof FormData;
  return api.post('/cover-letter', data, {
    headers: isFormData
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' },
  });
};

export const getCoverLetters = () => api.get('/cover-letter');

export const getCoverLetter = (id) => api.get(`/cover-letter/${id}`);

export const updateCoverLetter = (id, data) => api.put(`/cover-letter/${id}`, data);

export const setActiveCoverLetter = (id) => api.put(`/cover-letter/${id}/active`);

export const deleteCoverLetter = (id) => api.delete(`/cover-letter/${id}`);
