import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import type { PlaylistResult } from '../../types/song.types';
import '../../main.css';

export const Playlist: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const playlist = location.state?.playlist as PlaylistResult | null;

  const handleLogout = () => {
    console.log('Logged out');
    navigate('/');
  };

  const handleBack = () => {
    navigate('/dashboard');
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
        <div className="playlist-container">
          {/* Header Section */}
          <div className="playlist-page-header">
            <button className="back-button" onClick={handleBack}>
              ← Back to Dashboard
            </button>
            
            <div className="playlist-title-section">
              <div className="playlist-icon">🎵</div>
              <div>
                <h1 className="playlist-title">{playlist.mood} Playlist</h1>
                <p className="playlist-subtitle">{playlist.description}</p>
                <p className="playlist-meta">
                  {playlist.songs.length} songs • {formatDuration(totalDuration)}
                </p>
              </div>
            </div>

            <div className="playlist-actions-top">
              <button className="action-btn primary">
                <span>▶️</span> Play All
              </button>
              <button className="action-btn secondary">
                <span>📤</span> Export to Spotify
              </button>
              <button className="action-btn secondary">
                <span>💾</span> Save Playlist
              </button>
            </div>
          </div>

          {/* Songs Table */}
          <div className="playlist-table">
            <div className="table-header">
              <div className="col-number">#</div>
              <div className="col-title">Title</div>
              <div className="col-genre">Genre</div>
              <div className="col-stats">Stats</div>
              <div className="col-duration">Duration</div>
            </div>

            <div className="table-body">
              {playlist.songs.map((song, index) => (
                <div key={song.track_id} className="table-row">
                  <div className="col-number">{index + 1}</div>
                  
                  <div className="col-title">
                    <div className="song-main-info">
                      <div className="song-name">{song.track_name}</div>
                      <div className="song-artist">{song.artists}</div>
                    </div>
                  </div>
                  
                  <div className="col-genre">
                    <span className="genre-badge">{song.track_genre}</span>
                  </div>
                  
                  <div className="col-stats">
                    <div className="stats-group">
                      <span className="stat-item" title="Energy">
                        ⚡ {Math.round(song.energy * 100)}%
                      </span>
                      <span className="stat-item" title="Happiness">
                        😊 {Math.round(song.valence * 100)}%
                      </span>
                      <span className="stat-item" title="Danceability">
                        💃 {Math.round(song.danceability * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-duration">
                    {formatDuration(song.duration_ms)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};