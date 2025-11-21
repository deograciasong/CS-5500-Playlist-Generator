import React from 'react';
import type { PlaylistResult } from '../../types/song.types';

interface PlaylistDisplayProps {
  playlist: PlaylistResult;
  onClose: () => void;
}

export const PlaylistDisplay: React.FC<PlaylistDisplayProps> = ({ playlist, onClose }) => {
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration_ms, 0);

  return (
    <div className="playlist-modal">
      <div className="playlist-content">
        <div className="playlist-header">
          <div>
            <h2>🎵 {playlist.mood} Playlist</h2>
            <p className="playlist-description">{playlist.description}</p>
            <p className="playlist-info">
              {playlist.songs.length} songs • {formatDuration(totalDuration)}
            </p>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="playlist-songs">
          {playlist.songs.map((song, index) => (
            <div key={song.track_id} className="song-item">
              <div className="song-number">{index + 1}</div>
              <div className="song-info">
                <div className="song-title">{song.track_name}</div>
                <div className="song-artist">{song.artists}</div>
              </div>
              <div className="song-genre">{song.track_genre}</div>
              <div className="song-stats">
                <span className="stat" title="Energy">⚡ {Math.round(song.energy * 100)}%</span>
                <span className="stat" title="Happiness">😊 {Math.round(song.valence * 100)}%</span>
              </div>
              <div className="song-duration">{formatDuration(song.duration_ms)}</div>
            </div>
          ))}
        </div>

        <div className="playlist-actions">
          <button className="action-button primary">Export to Spotify</button>
          <button className="action-button secondary">Save Playlist</button>
        </div>
      </div>
    </div>
  );
};