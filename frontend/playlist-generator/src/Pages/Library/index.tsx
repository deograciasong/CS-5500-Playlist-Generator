import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';
import '../../main.css';


interface Song {
  id: string;
  name: string;
  artist: string;
  duration?: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  createdAt: Date;
}

export const Library: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = () => {
    const savedPlaylists = JSON.parse(
      localStorage.getItem('savedPlaylists') || '[]'
    );
    setPlaylists(savedPlaylists);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
    localStorage.setItem('savedPlaylists', JSON.stringify(updatedPlaylists));
    setPlaylists(updatedPlaylists);
  };

  return (
    <>
      <div className="gradient-bg"></div>
      <Sidebar 
        onLogin={() => {}} 
        onSignup={() => {}} 
        isAuthenticated={true} 
        onLogout={() => {}} 
      />

      <div className="library-content">
        <h1 className="library-title">Your Library</h1>
        <p className="library-subtitle">{playlists.length} saved playlists</p>

        <div className="playlists-grid">
          {playlists.length === 0 ? (
            <div className="empty-state">
              <p>No playlists saved yet.</p>
              <p>Generate a playlist and save it to see it here!</p>
            </div>
          ) : (
            playlists.map((playlist) => (
              <div key={playlist.id} className="playlist-card">
                <div className="playlist-card-header">
                  <h3>{playlist.name}</h3>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeletePlaylist(playlist.id)}
                  >
                    🗑️
                  </button>
                </div>
                <p className="playlist-card-description">{playlist.description}</p>
                <div className="playlist-card-footer">
                  <span>{playlist.songs.length} songs</span>
                  <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};