import type { PlaylistResult } from '../types/song.types';

export interface SavedPlaylist {
  id: string;
  playlist: PlaylistResult;
  savedAt: string;
  coverEmoji: string;
}

class PlaylistStorageService {
  private readonly STORAGE_KEY = 'moodtune_saved_playlists';

  /**
   * Save a playlist to localStorage
   */
  savePlaylist(playlist: PlaylistResult): SavedPlaylist {
    const savedPlaylists = this.getAllPlaylists();
    
    const newSavedPlaylist: SavedPlaylist = {
      id: `playlist_${Date.now()}`,
      playlist,
      savedAt: new Date().toISOString(),
      coverEmoji: this.getRandomEmoji(),
    };

    savedPlaylists.push(newSavedPlaylist);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedPlaylists));
    
    return newSavedPlaylist;
  }

  /**
   * Get all saved playlists
   */
  getAllPlaylists(): SavedPlaylist[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading playlists:', error);
      return [];
    }
  }

  /**
   * Get a single playlist by ID
   */
  getPlaylistById(id: string): SavedPlaylist | null {
    const playlists = this.getAllPlaylists();
    return playlists.find(p => p.id === id) || null;
  }

  /**
   * Delete a playlist
   */
  deletePlaylist(id: string): boolean {
    try {
      const playlists = this.getAllPlaylists();
      const filtered = playlists.filter(p => p.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }
  }

  /**
   * Get random emoji for playlist cover
   */
  private getRandomEmoji(): string {
    const emojis = ['🎵', '🎶', '🎧', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎼', '🎙️', '📻'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  /**
   * Clear all playlists (for testing)
   */
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const playlistStorage = new PlaylistStorageService();