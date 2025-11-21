import api from '../services/api';
import type { Playlist } from '../types';

export const playlistService = {
  generatePlaylist: async (moodInput: string): Promise<Playlist> => {
    const response = await api.post('/playlists/generate', { moodInput });
    return response.data.playlist;
  },

  getUserPlaylists: async (): Promise<Playlist[]> => {
    const response = await api.get('/playlists');
    return response.data.playlists;
  },

  getPlaylistById: async (id: string): Promise<Playlist> => {
    const response = await api.get(`/playlists/${id}`);
    return response.data.playlist;
  }
};