import api from './api';
import type { User } from '../types';

export const authService = {
  getSpotifyAuthUrl: async (): Promise<string> => {
    const response = await api.get('/auth/spotify');
    return response.data.authUrl;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  loginLocal: async (payload: { email: string; password: string }) => {
    const response = await api.post('/auth/login-local', payload);
    // return both token and user if provided by backend
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  }
};