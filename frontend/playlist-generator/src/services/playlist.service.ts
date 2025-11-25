import api from '../services/api';
import type { Playlist } from '../types';

export const playlistService = {
  generatePlaylist: async (moodInput: string): Promise<Playlist> => {
    const response = await api.post('/spotify/playlists/generate', { moodInput });
    return response.data.playlist;
  },

  getUserPlaylists: async (): Promise<Playlist[]> => {
    const response = await api.get('/spotify/playlists');
    return response.data.playlists;
  },

  getPlaylistById: async (id: string): Promise<Playlist> => {
    const response = await api.get(`/spotify/playlists/${id}`);
    return response.data.playlist;
  },

  createSpotifyPlaylist: async (payload: { name: string; description?: string; public?: boolean; collaborative?: boolean }) => {
    const response = await api.post('/spotify/playlists', payload);
    return response.data as { id: string; name: string; external_urls?: { spotify?: string } };
  },

  addTracksToSpotifyPlaylist: async (playlistId: string, uris: string[]) => {
    // Spotify allows up to 100 tracks per request
    const chunkSize = 100;
    for (let i = 0; i < uris.length; i += chunkSize) {
      const chunk = uris.slice(i, i + chunkSize);
      await api.post(`/spotify/playlists/${playlistId}/tracks`, { uris: chunk });
    }
  }
};
