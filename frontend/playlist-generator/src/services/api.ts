import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// By default, rely on httpOnly cookies for auth. To send a bearer explicitly,
// opt in by setting `config.headers['X-Use-Bearer'] = 'true'`.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers?.['X-Use-Bearer'] === 'true') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Clean up the marker header so it isn't sent to the server
  if (config.headers?.['X-Use-Bearer']) {
    delete (config.headers as any)['X-Use-Bearer'];
  }
  return config;
});

export default api;
