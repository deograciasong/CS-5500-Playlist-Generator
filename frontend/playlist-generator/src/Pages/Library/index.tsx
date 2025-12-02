import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { Background } from '../../components/ui/Background';
import { SavedPlaylist, useSavedPlaylists } from '../../services/playlistStorage.service';
import '../../main.css';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { playlists: savedPlaylists, loading, error, deletePlaylist } = useSavedPlaylists();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    console.log('Logged out');
    navigate('/');
  };

  const handlePlaylistClick = (savedPlaylist: SavedPlaylist) => {
    // Navigate to playlist page with the saved playlist data
    navigate('/playlist', { state: { playlist: savedPlaylist.playlist, savedId: savedPlaylist.id } });
  };

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the playlist
    
    if (window.confirm('Delete this playlist?')) {
      try {
        await deletePlaylist(id);
      } catch (err: any) {
        const message =
          err?.response?.data?.message ??
          err?.message ??
          'Failed to delete playlist';
        alert(message);
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
        />
      </div>

      <div className="library-page">
        <div className="library-header">
          <h1 className="library-title">Your Library</h1>
          <p className="library-subtitle">
            {savedPlaylists.length} {savedPlaylists.length === 1 ? 'playlist' : 'playlists'} saved
          </p>
        </div>

        {error && (
          <div className="save-error-banner">
            {error}
          </div>
        )}

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
                    {savedPlaylist.playlist.mood} Playlist
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
