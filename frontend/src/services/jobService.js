import api from './api.js';

export const getJobs = (params = {}) => api.get('/jobs', { params });

export const getPlatforms = () => api.get('/jobs/platforms');

export const scrapeJobs = (data = {}) => api.post('/jobs/scrape', data);

export const exportJobsCsv = (params = {}) => api.get('/jobs/export', { params, responseType: 'blob' });

export const getLastScrape = () => api.get('/jobs/last-scrape');

export const getJobAnalytics = () => api.get('/jobs/analytics');
