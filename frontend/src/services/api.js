import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          toast.error('Session expired. Please log in again.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error(data?.message || 'Resource not found.');
          break;
        case 422:
          toast.error(data?.message || 'Validation error.');
          break;
        case 429:
          toast.error('Too many requests. Please slow down.');
          break;
        case 500:
          toast.error(data?.message || 'Internal server error. Please try again later.');
          break;
        default:
          toast.error(data?.message || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your internet connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default api;
