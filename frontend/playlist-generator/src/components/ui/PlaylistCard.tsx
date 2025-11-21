import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Playlist } from '../../types';

interface PlaylistCardProps {
  playlist: Playlist;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="playlist-card" onClick={() => navigate(`/playlist/${playlist._id}`)}>
      <div className="playlist-cover">🎵</div>
      <div className="playlist-info">
        <h4>{playlist.playlistName}</h4>
        <p className="playlist-meta">
          {playlist.tracks.length} songs • {formatDate(playlist.createdAt)}
        </p>
        <div className="playlist-stats">
          <div>⚡ {playlist.tracks[0]?.audioFeatures?.energy.toFixed(2) || 'N/A'}</div>
          <div>🎵 {playlist.tracks[0]?.audioFeatures?.tempo.toFixed(0) || 'N/A'} bpm</div>
        </div>
      </div>
    </div>
  );
};