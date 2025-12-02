import { useCallback, useEffect, useState } from 'react';
import api from './api';
import type { PlaylistResult } from '../types/song.types';

export interface SavedPlaylist {
  id: string;
  playlist: PlaylistResult;
  savedAt: string;
  coverEmoji: string;
}

function normalize(raw: any): SavedPlaylist {
  return {
    id: String(raw?.id ?? raw?._id),
    playlist: raw?.playlist,
    coverEmoji: raw?.coverEmoji ?? '🎵',
    savedAt: raw?.savedAt ?? raw?.createdAt ?? new Date().toISOString(),
  };
}

export const playlistStorage = {
  async savePlaylist(playlist: PlaylistResult): Promise<SavedPlaylist> {
    const response = await api.post('/playlists', { playlist });
    return normalize(response.data?.playlist ?? response.data);
  },

  async getAllPlaylists(): Promise<SavedPlaylist[]> {
    const response = await api.get('/playlists');
    const payload = response.data?.playlists ?? response.data ?? [];
    if (!Array.isArray(payload)) return [];
    return payload.map(normalize);
  },

  async getPlaylistById(id: string): Promise<SavedPlaylist> {
    const response = await api.get(`/playlists/${id}`);
    return normalize(response.data?.playlist ?? response.data);
  },

  async deletePlaylist(id: string): Promise<void> {
    await api.delete(`/playlists/${id}`);
  },
};

export function useSavedPlaylists(options: { autoLoad?: boolean } = {}) {
  const autoLoad = options.autoLoad !== false;
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await playlistStorage.getAllPlaylists();
      setPlaylists(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        'Failed to load playlists';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    reload();
  }, [autoLoad, reload]);

  const savePlaylistToLibrary = useCallback(async (playlist: PlaylistResult) => {
    const saved = await playlistStorage.savePlaylist(playlist);
    setPlaylists((prev) => [saved, ...prev]);
    return saved;
  }, []);

  const deletePlaylistFromLibrary = useCallback(async (id: string) => {
    await playlistStorage.deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPlaylistById = useCallback(async (id: string) => {
    return playlistStorage.getPlaylistById(id);
  }, []);

  return {
    playlists,
    loading,
    error,
    reload,
    savePlaylist: savePlaylistToLibrary,
    deletePlaylist: deletePlaylistFromLibrary,
    getPlaylistById,
  };
}
