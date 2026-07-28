import api from './api.js';

export const getLogs = (params) =>
  api.get('/logs', {
    params: {
      page: params?.page,
      limit: params?.limit,
      search: params?.search || undefined,
      status: params?.status || undefined,
      startDate: params?.startDate || undefined,
      endDate: params?.endDate || undefined,
    },
  });

export const deleteLogs = (ids) => api.delete('/logs', { data: { ids } });

export const exportCSV = () =>
  api.get('/logs/export/csv', { responseType: 'blob' });

export const exportExcel = () =>
  api.get('/logs/export/excel', { responseType: 'blob' });
