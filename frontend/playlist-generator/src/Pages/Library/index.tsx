import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { Background } from '../../components/ui/Background';
import type { User, SpotifyUserProfile } from '../../types/index';
import { authService } from '../../services/auth.service';
import { playlistStorage, SavedPlaylist } from '../../services/playlistStorage.service';
import '../../main.css';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | SpotifyUserProfile | null>(null);

  useEffect(() => {
    loadUser();
    loadPlaylists();
  }, []);

  const loadUser = async () => {
    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const loadPlaylists = async () => {
    try {
      const playlists = await playlistStorage.getAllPlaylists();
      setSavedPlaylists(playlists);
    } catch (err) {
      console.error('Failed to load playlists:', err);
      setSavedPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logged out');
    navigate('/');
  };

  const handlePlaylistClick = (savedPlaylist: SavedPlaylist) => {
    // Navigate to playlist page with the saved playlist data
    navigate('/playlist', { state: { playlist: savedPlaylist.playlist } });
  };

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the playlist
    
    if (window.confirm('Delete this playlist?')) {
      try {
        await playlistStorage.deletePlaylist(id);
        await loadPlaylists(); // Reload the list
      } catch (err) {
        console.error('Failed to delete playlist:', err);
        alert('Failed to delete playlist. Please try again.');
      }
    }
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getTotalDuration = (playlist: SavedPlaylist): string => {
    const totalMs = playlist.playlist.songs.reduce((acc: number, song) => acc + song.duration_ms, 0);
    const minutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <>
        <div className="gradient-bg"></div>
        
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-button"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        
        {isMobileMenuOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        <div className={isMobileMenuOpen ? 'open' : ''}>
          <Sidebar 
            onLogin={() => {}} 
            onSignup={() => {}} 
            isAuthenticated={true} 
            onLogout={handleLogout}
            user={user} 
          />
        </div>
        
        <div className="library-page">
          <div className="loading-state">Loading your library...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />
      
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="mobile-menu-button"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>
      
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={isMobileMenuOpen ? 'open' : ''}>
        <Sidebar 
          onLogin={() => {}} 
          onSignup={() => {}} 
          isAuthenticated={true} 
          onLogout={handleLogout} 
          user={user}
        />
      </div>

      <div className="library-page">
        <div className="library-header">
          <h1 className="library-title">Your Library</h1>
          <p className="library-subtitle">
            {savedPlaylists.length} {savedPlaylists.length === 1 ? 'playlist' : 'playlists'} saved
          </p>
        </div>

        {savedPlaylists.length === 0 ? (
          <div className="empty-library">
            <div className="empty-icon">📚</div>
            <h2>No saved playlists yet</h2>
            <p>Generate a mood-based playlist and save it to see it here!</p>
            <button className="go-dashboard-btn" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="library-grid">
            {savedPlaylists.map((savedPlaylist) => (
              <div 
                key={savedPlaylist.id} 
                className="library-card"
                onClick={() => handlePlaylistClick(savedPlaylist)}
              >
                <div className="library-card-cover">
                  <div className="cover-emoji">{savedPlaylist.coverEmoji}</div>
                </div>
                
                <div className="library-card-content">
                  <h3 className="library-card-title">
                    {(() => {
                      const raw = (savedPlaylist.playlist.mood || '').toString().trim();
                      // If mood is AI or AI Playlist (any case), show 'AI Playlist'
                      if (/^ai(\s*playlist)?$/i.test(raw)) return 'AI Playlist';
                      // If mood already contains 'playlist', leave as-is
                      if (/playlist/i.test(raw)) return raw;
                      // Default: append 'Playlist'
                      return `${raw} Playlist`;
                    })()}
                  </h3>
                  <p className="library-card-description">
                    {savedPlaylist.playlist.description}
                  </p>
                  <div className="library-card-meta">
                    <span>{savedPlaylist.playlist.songs.length} songs</span>
                    <span>•</span>
                    <span>{getTotalDuration(savedPlaylist)}</span>
                    <span>•</span>
                    <span className="saved-time">{formatDate(savedPlaylist.savedAt)}</span>
                  </div>
                </div>

                <button 
                  className="delete-playlist-btn"
                  onClick={(e) => handleDeletePlaylist(savedPlaylist.id, e)}
                  title="Delete playlist"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};