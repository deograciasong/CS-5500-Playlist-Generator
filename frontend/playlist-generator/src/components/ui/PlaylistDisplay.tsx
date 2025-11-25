import React from 'react';
import '../../main.css';

interface Song {
  id: string;
  name: string;
  artist: string;
  album?: string;
  duration?: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  createdAt: Date;
}

interface PlaylistDisplayProps {
  playlist: Playlist;
  onClose: () => void;
  onSave: (playlist: Playlist) => void;
}

export const PlaylistDisplay: React.FC<PlaylistDisplayProps> = ({ 
  playlist, 
  onClose, 
  onSave 
}) => {
  return (
    <div className="playlist-modal-overlay" onClick={onClose}>
      <div className="playlist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="playlist-header">
          <h2>{playlist.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <p className="playlist-description">{playlist.description}</p>
        
        <div className="playlist-songs">
          {playlist.songs.map((song, index) => (
            <div key={song.id} className="song-item">
              <span className="song-number">{index + 1}</span>
              <div className="song-info">
                <div className="song-name">{song.name}</div>
                <div className="song-artist">{song.artist}</div>
              </div>
              {song.duration && (
                <span className="song-duration">{song.duration}</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="playlist-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={() => onSave(playlist)}>
            💾 Save to Library
          </button>
        </div>
      </div>
    </div>
  );
};