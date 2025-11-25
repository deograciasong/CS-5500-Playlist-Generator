import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { playlistStorage } from '../../services/playlistStorage.service';
import type { PlaylistResult } from '../../types/song.types';
import '../../main.css';

export const Playlist: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const playlist = location.state?.playlist as PlaylistResult | null;
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // Debug: Log when component mounts
    console.log('Playlist component mounted');
    console.log('Playlist data:', playlist);
  }, [playlist]);

  const handleLogout = () => {
    console.log('Logged out');
    navigate('/');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSavePlaylist = () => {
    console.log('Save button clicked!');
    
    if (!playlist) {
      console.error('No playlist data to save');
      setSaveError('No playlist data available');
      return;
    }
    
    try {
      console.log('Attempting to save playlist...');
      const savedPlaylist = playlistStorage.savePlaylist(playlist);
      console.log('Playlist saved successfully:', savedPlaylist);
      
      setIsSaved(true);
      setSaveError(null);
      
      // Show success message temporarily
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
      
      // Also log to console for verification
      console.log('All saved playlists:', playlistStorage.getAllPlaylists());
      
    } catch (error) {
      console.error('Error saving playlist:', error);
      setSaveError('Failed to save playlist. Check console for details.');
      alert('Failed to save playlist. Please check the console for errors.');
    }
  };

  const handleViewLibrary = () => {
    console.log('Navigating to library...');
    navigate('/library');
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!playlist) {
    return (
      <>
        <div className="gradient-bg"></div>
        <Sidebar 
          onLogin={() => {}} 
          onSignup={() => {}} 
          isAuthenticated={true} 
          onLogout={handleLogout} 
        />
        <div className="playlist-page">
          <div className="playlist-error">
            <h2>No Playlist Found</h2>
            <p>Please generate a playlist from the dashboard first.</p>
            <button className="back-button" onClick={handleBack}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration_ms, 0);

  return (
    <>
      <div className="gradient-bg"></div>
      <Sidebar 
        onLogin={() => {}} 
        onSignup={() => {}} 
        isAuthenticated={true} 
        onLogout={handleLogout} 
      />

      <div className="playlist-page">
        <button className="back-button" onClick={handleBack}>
          ← Back to Dashboard
        </button>
        
        {/* Top Section - From Option 2 */}
        <div className="playlist-header-section">
          <div className="playlist-icon-large">🎵</div>
          <div className="playlist-header-info">
            <h1 className="playlist-main-title">{playlist.mood} Playlist</h1>
            <p className="playlist-description">{playlist.description}</p>
            <p className="playlist-meta-info">
              {playlist.songs.length} songs • {formatDuration(totalDuration)}
            </p>
          </div>
        </div>

        <div className="playlist-actions-bar">
          <button className="playlist-action-btn primary">
            <span>▶️</span> Play All
          </button>
          <button className="playlist-action-btn secondary">
            <span>📤</span> Export to Spotify
          </button>
          <button 
            className={`playlist-action-btn ${isSaved ? 'saved' : 'secondary'}`}
            onClick={handleSavePlaylist}
            disabled={isSaved}
          >
            <span>{isSaved ? '✓' : '💾'}</span> {isSaved ? 'Saved!' : 'Save Playlist'}
          </button>
        </div>

        {/* Success Banner */}
        {isSaved && (
          <div className="save-success-banner">
            Playlist saved to your library! 
            <button className="view-library-link" onClick={handleViewLibrary}>
              View Library
            </button>
          </div>
        )}

        {/* Error Message */}
        {saveError && (
          <div className="save-error-banner">
            {saveError}
          </div>
        )}

        {/* Song List - From Option 1 */}
        <div className="playlist-songs-container">
          <div className="playlist-songs-list">
            {playlist.songs.map((song, index) => (
              <div key={song.track_id} className="playlist-song-item">
                <div className="song-item-number">{index + 1}</div>
                
                <div className="song-item-info">
                  <div className="song-item-title">{song.track_name}</div>
                  <div className="song-item-artist">{song.artists}</div>
                </div>
                
                <div className="song-item-genre">
                  <span className="genre-tag">{song.track_genre}</span>
                </div>
                
                <div className="song-item-stats">
                  <span className="stat-badge" title="Energy">
                    ⚡ {Math.round(song.energy * 100)}%
                  </span>
                  <span className="stat-badge" title="Happiness">
                    😊 {Math.round(song.valence * 100)}%
                  </span>
                </div>
                
                <div className="song-item-duration">
                  {formatDuration(song.duration_ms)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};