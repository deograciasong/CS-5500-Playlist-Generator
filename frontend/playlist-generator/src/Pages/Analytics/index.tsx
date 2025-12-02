import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { Background } from '../../components/ui/Background';
import { authService } from '../../services/auth.service';
import type { User, SpotifyUserProfile } from '../../types/index';
import { playlistStorage, SavedPlaylist } from '../../services/playlistStorage.service';
import '../../main.css';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | SpotifyUserProfile | null>(null);
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      navigate('/');
    } finally {
      setLoading(false);
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
    authService.logout();
    navigate('/');
  };

  // Mock analytics data
  const stats = {
    totalSongs: 487,
    hoursListened: 142,
    favoriteGenre: 'Indie Rock',
  };

  const moodData = [
    { mood: 'Energetic', count: 45, color: '#f59e0b' },
    { mood: 'Chill', count: 38, color: '#8b5cf6' },
    { mood: 'Happy', count: 32, color: '#ec4899' },
    { mood: 'Focus', count: 28, color: '#3b82f6' },
    { mood: 'Sad', count: 15, color: '#6366f1' },
  ];

  const audioFeatures = [
    { feature: 'Energy', value: 72 },
    { feature: 'Danceability', value: 65 },
    { feature: 'Valence', value: 58 },
    { feature: 'Acousticness', value: 42 },
    { feature: 'Instrumentalness', value: 35 },
  ];


  if (loading) {
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
        <div className="analytics-page">
          <div className="loading-state">Loading analytics...</div>
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

      <div className="analytics-page">
        <div className="analytics-header">
          <h1 className="analytics-title">Your Music Analytics</h1>
          <p className="analytics-subtitle">Insights into your listening habits and mood patterns</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎵</div>
            <div className="stat-content">
              <div className="stat-value">{savedPlaylists.length}</div>
              <div className="stat-label">Playlists Created</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎧</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalSongs}</div>
              <div className="stat-label">Songs Discovered</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.hoursListened}</div>
              <div className="stat-label">Hours Listened</div>
            </div>
          </div>
          
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          {/* Mood Distribution */}
          <div className="chart-card">
            <h2 className="chart-title">Mood Distribution</h2>
            <p className="chart-subtitle">Your most generated moods</p>
            <div className="mood-bars">
              {moodData.map((item) => (
                <div key={item.mood} className="mood-bar-item">
                  <div className="mood-bar-label">
                    <span>{item.mood}</span>
                    <span className="mood-bar-count">{item.count}</span>
                  </div>
                  <div className="mood-bar-container">
                    <div 
                      className="mood-bar-fill"
                      style={{
                        width: `${(item.count / 45) * 100}%`,
                        background: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Audio Features */}
          <div className="chart-card">
            <h2 className="chart-title">Audio Profile</h2>
            <p className="chart-subtitle">Your music characteristics</p>
            <div className="audio-features">
              {audioFeatures.map((item) => (
                <div key={item.feature} className="audio-feature-item">
                  <div className="audio-feature-label">
                    <span>{item.feature}</span>
                    <span className="audio-feature-value">{item.value}%</span>
                  </div>
                  <div className="audio-feature-bar">
                    <div 
                      className="audio-feature-fill"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Insights */}
        <div className="insights-section">
          <h2 className="insights-title">💡 Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-emoji">🌟</div>
              <h3>Most Active Day</h3>
              <p>You create the most playlists on <strong>Fridays</strong>, perfect for weekend vibes!</p>
            </div>
            <div className="insight-card">
              <div className="insight-emoji">🎭</div>
              <h3>Mood Patterns</h3>
              <p>Your mood selections show a balanced mix, with a preference for <strong>energetic</strong> vibes.</p>
            </div>
            <div className="insight-card">
              <div className="insight-emoji">🎸</div>
              <h3>Genre Diversity</h3>
              <p>You explore <strong>6 different genres</strong> regularly, showing eclectic taste!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};