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

  logout: () => {
    localStorage.removeItem('token');
  }
};