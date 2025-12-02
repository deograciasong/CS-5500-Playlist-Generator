import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { useSavedPlaylists } from '../../services/playlistStorage.service';
import { playlistService } from '../../services/playlist.service';
import type { User, SpotifyUserProfile } from '../../types/index';
import { authService } from '../../services/auth.service';
import type { PlaylistResult } from '../../types/song.types';
import '../../main.css';

export const Playlist: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const playlist = location.state?.playlist as PlaylistResult | null;
  const { savePlaylist } = useSavedPlaylists({ autoLoad: false });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | SpotifyUserProfile | null>(null);

  useEffect(() => {
    // Debug: Log when component mounts
    loadUser();
    console.log('Playlist component mounted');
    console.log('Playlist data:', playlist);
  }, [playlist]);

    const loadUser = async () => {
      try {
        const profile = await authService.getCurrentUser();
        setUser(profile);
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    };

  const handleLogout = () => {
    console.log('Logged out');
    navigate('/');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };


  const handleSavePlaylist = async () => {
    if (!playlist) {
      setSaveError('No playlist data available');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      await savePlaylist(playlist);
      setIsSaved(true);
      
      // Show success message temporarily
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ??
        (error as any)?.message ??
        'Failed to save playlist';
      setSaveError(message);
    }
    setIsSaving(false);
  };

  const handleViewLibrary = () => {
    console.log('Navigating to library...');
    navigate('/library');
  };

  const handleExportToSpotify = async () => {
    if (!playlist) {
      setExportError('No playlist data available');
      return;
    }

    setExportError(null);
    setIsExporting(true);
    setExportedUrl(null);

    try {
      const name = (playlist.mood && playlist.mood.trim().length > 0)
        ? playlist.mood
        : `MoodTune Playlist ${new Date().toLocaleDateString()}`;
      const description = playlist.description || '';
      const created = await playlistService.createSpotifyPlaylist({
        name,
        description,
        public: true,
      });

      const uris = playlist.songs.map((song) => `spotify:track:${song.track_id}`);
      if (uris.length > 0) {
        await playlistService.addTracksToSpotifyPlaylist(created.id, uris);
      }

      const url = created.external_urls?.spotify ?? `https://open.spotify.com/playlist/${created.id}`;
      setExportedUrl(url);
    } catch (error: any) {
      console.error('Failed to export playlist to Spotify', error);
        // Log server response body (useful for debugging backend validation errors)
        const serverBody = error?.response?.data;
        console.debug('Export error response body:', serverBody);
        const message = serverBody?.message ?? serverBody?.error ?? error?.message ?? 'Export failed';
        setExportError(message);
    } finally {
      setIsExporting(false);
    }
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

      <div className="playlist-page">
        <button className="back-button" onClick={handleBack}>
          ← Back to Dashboard
        </button>
        
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
          <button 
            className="playlist-action-btn secondary"
            onClick={handleExportToSpotify}
            disabled={isExporting}
          >
            <span>📤</span> {isExporting ? 'Exporting...' : 'Export to Spotify'}
          </button>
          <button 
            className={`playlist-action-btn ${isSaved ? 'saved' : 'secondary'}`}
            onClick={handleSavePlaylist}
            disabled={isSaved || isSaving}
          >
            <span>{isSaved ? '✓' : '💾'}</span> {isSaved ? 'Saved!' : (isSaving ? 'Saving...' : 'Save Playlist')}
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

        {/* Export status */}
        {exportedUrl && (
          <div className="save-success-banner">
            Playlist exported to Spotify!{' '}
            <a href={exportedUrl} target="_blank" rel="noreferrer" className="view-library-link">
              Open in Spotify
            </a>
          </div>
        )}
        {exportError && (
          <div className="save-error-banner">
            {exportError}
          </div>
        )}

        {/* Song List */}
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
