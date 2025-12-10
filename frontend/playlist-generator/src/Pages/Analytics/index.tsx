import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { Background } from '../../components/ui/Background';
import { authService } from '../../services/auth.service';
import { useSavedPlaylists } from '../../services/playlistStorage.service';
import type { User, SpotifyUserProfile } from '../../types';
import '../../main.css';

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | SpotifyUserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { playlists, loading } = useSavedPlaylists({ autoLoad: true }); // ← FIXED: playlists not savedPlaylists

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
    } catch (err) {
      console.error('Failed to load user:', err);
      navigate('/');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // Calculate statistics
  const totalPlaylists = playlists.length;
  const totalSongs = playlists.reduce((acc, p) => acc + p.playlist.songs.length, 0);
  
  const isGeminiPlaylist = (p: (typeof playlists)[number]) => {
    const playlist: any = p.playlist || {};
    const mood = (playlist.mood || '').toLowerCase();
    const desc = (playlist.description || '').toLowerCase();
    const generator = (playlist.generator || '').toLowerCase();
    const source = (playlist.source || '').toLowerCase();

    if (playlist.isGemini) return true;
    if (generator.includes('gemini') || source.includes('gemini')) return true;
    return mood.includes('gemini') || desc.includes('gemini');
  };

  // Separate playlists by generation method
  const geminiPlaylists = playlists.filter(isGeminiPlaylist);
  const spotifyAIPlaylists = playlists.filter(p => !isGeminiPlaylist(p));

  // Calculate average audio features for each AI
  const calculateAverageFeatures = (playlistArray: typeof playlists) => {
    if (playlistArray.length === 0) return null;
    
    const allSongs = playlistArray.flatMap(p => p.playlist.songs);
    if (allSongs.length === 0) return null;

    return {
      energy: allSongs.reduce((acc, s) => acc + s.energy, 0) / allSongs.length,
      valence: allSongs.reduce((acc, s) => acc + s.valence, 0) / allSongs.length,
      danceability: allSongs.reduce((acc, s) => acc + s.danceability, 0) / allSongs.length,
      tempo: allSongs.reduce((acc, s) => acc + s.tempo, 0) / allSongs.length,
    };
  };

  const geminiFeatures = calculateAverageFeatures(geminiPlaylists);
  const spotifyFeatures = calculateAverageFeatures(spotifyAIPlaylists);

  // Most popular moods
  const moodCounts: { [key: string]: number } = {};
  playlists.forEach(p => {
    const mood = p.playlist.mood || 'Unknown';
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });
  
  const topMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate diversity score (variety of moods)
  const uniqueMoods = Object.keys(moodCounts).length;
  const diversityScore = Math.min((uniqueMoods / 10) * 100, 100);

  // Average playlist duration
  const avgDuration = playlists.length > 0
    ? playlists.reduce((acc, p) => {
        const duration = p.playlist.songs.reduce((s, song) => s + song.duration_ms, 0);
        return acc + duration;
      }, 0) / playlists.length
    : 0;

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <>
        <Background />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: 'white'
        }}>
          <div className="spinner"></div>
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
          isAuthenticated={!!user} 
          onLogout={handleLogout} 
          user={user}
        />
      </div>

      <div className="analytics-page">
        <div className="analytics-container">
          <h1 className="analytics-title">📊 Your Music Analytics</h1>
          
          {totalPlaylists === 0 ? (
            <div className="empty-state">
              <h2>No Analytics Yet</h2>
              <p>Generate and save some playlists to see your music analytics!</p>
              <button 
                className="cta-button"
                onClick={() => navigate('/dashboard')}
              >
                Create Playlist
              </button>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🎵</div>
                  <div className="stat-value">{totalPlaylists}</div>
                  <div className="stat-label">Playlists Created</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🎧</div>
                  <div className="stat-value">{totalSongs}</div>
                  <div className="stat-label">Total Songs</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-value">{formatDuration(avgDuration)}</div>
                  <div className="stat-label">Avg Duration</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🎨</div>
                  <div className="stat-value">{Math.round(diversityScore)}%</div>
                  <div className="stat-label">Mood Diversity</div>
                </div>
              </div>

              {/* ✨ AI COMPARISON SECTION */}
              <div className="ai-comparison-section">
                <h2 className="section-title">
                  🤖 AI Performance Comparison
                </h2>
                <p className="section-subtitle">
                  Comparing Gemini AI vs Spotify AI playlist generation
                </p>

                <div className="comparison-grid">
                  {/* Gemini AI Card */}
                  <div className="ai-card gemini">
                    <div className="ai-card-header">
                      <div className="ai-badge gemini-badge">✨ Gemini AI</div>
                      <div className="ai-description">Natural Language Processing</div>
                    </div>
                    
                    <div className="ai-stats">
                      <div className="ai-stat-item">
                        <span className="ai-stat-label">Playlists Generated</span>
                        <span className="ai-stat-value">{geminiPlaylists.length}</span>
                      </div>
                      <div className="ai-stat-item">
                        <span className="ai-stat-label">Total Songs</span>
                        <span className="ai-stat-value">
                          {geminiPlaylists.reduce((acc, p) => acc + p.playlist.songs.length, 0)}
                        </span>
                      </div>
                      <div className="ai-stat-item">
                        <span className="ai-stat-label">Usage Rate</span>
                        <span className="ai-stat-value">
                          {totalPlaylists > 0 ? Math.round((geminiPlaylists.length / totalPlaylists) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    {geminiFeatures && (
                      <div className="audio-features">
                        <h4>Average Audio Features</h4>
                        <div className="feature-bars">
                          <div className="feature-bar">
                            <div className="feature-label">
                              <span>⚡ Energy</span>
                              <span>{Math.round(geminiFeatures.energy * 100)}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill gemini-fill" 
                                style={{ width: `${geminiFeatures.energy * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="feature-bar">
                            <div className="feature-label">
                              <span>😊 Positivity</span>
                              <span>{Math.round(geminiFeatures.valence * 100)}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill gemini-fill" 
                                style={{ width: `${geminiFeatures.valence * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="feature-bar">
                            <div className="feature-label">
                              <span>💃 Danceability</span>
                              <span>{Math.round(geminiFeatures.danceability * 100)}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill gemini-fill" 
                                style={{ width: `${geminiFeatures.danceability * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="feature-bar">
                            <div className="feature-label">
                              <span>🎹 Tempo</span>
                              <span>{Math.round(geminiFeatures.tempo)} BPM</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill gemini-fill" 
                                style={{ width: `${Math.min((geminiFeatures.tempo / 200) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Spotify AI Card */}
                  <div className="ai-card spotify">
                    <div className="ai-card-header">
                      <div className="ai-badge spotify-badge">🎵 Spotify AI</div>
                      <div className="ai-description">Library-Based Generation</div>
                    </div>
                    
                    <div className="ai-stats">
                      <div className="ai-stat-item">
                        <span className="ai-stat-label">Playlists Generated</span>
                        <span className="ai-stat-value">{spotifyAIPlaylists.length}</span>
                      </div>
                      <div className="ai-stat-item">
                        <span className="ai-stat-label">Total Songs</span>
                        <span className="ai-stat-value">
                          {spotifyAIPlaylists.reduce((acc, p) => acc + p.playlist.songs.length, 0)}
                        </span>
                      </div>
                      <div className="ai-stat-item">
                        <span className="ai-stat-label">Usage Rate</span>
                        <span className="ai-stat-value">
                          {totalPlaylists > 0 ? Math.round((spotifyAIPlaylists.length / totalPlaylists) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    {spotifyFeatures && (
                      <div className="audio-features">
                        <h4>Average Audio Features</h4>
                        <div className="feature-bars">
                          <div className="feature-bar">
                            <div className="feature-label">
                              <span>⚡ Energy</span>
                              <span>{Math.round(spotifyFeatures.energy * 100)}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill spotify-fill" 
                                style={{ width: `${spotifyFeatures.energy * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="feature-bar">
                            <div className="feature-label">
                              <span>😊 Positivity</span>
                              <span>{Math.round(spotifyFeatures.valence * 100)}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill spotify-fill" 
                                style={{ width: `${spotifyFeatures.valence * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="feature-bar">
                            <div className="feature-label">
                              <span>💃 Danceability</span>
                              <span>{Math.round(spotifyFeatures.danceability * 100)}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill spotify-fill" 
                                style={{ width: `${spotifyFeatures.danceability * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="feature-bar">
                            <div className="feature-label">
                              <span>🎹 Tempo</span>
                              <span>{Math.round(spotifyFeatures.tempo)} BPM</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill spotify-fill" 
                                style={{ width: `${Math.min((spotifyFeatures.tempo / 200) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Winner Declaration */}
                {geminiPlaylists.length > 0 && spotifyAIPlaylists.length > 0 && (
                  <div className="winner-banner">
                    <h3>🏆 Most Used AI</h3>
                    <div className="winner-content">
                      {geminiPlaylists.length > spotifyAIPlaylists.length ? (
                        <>
                          <div className="winner-badge">✨ Gemini AI</div>
                          <p>You prefer natural language playlist generation!</p>
                        </>
                      ) : geminiPlaylists.length < spotifyAIPlaylists.length ? (
                        <>
                          <div className="winner-badge">🎵 Spotify AI</div>
                          <p>You prefer library-based recommendations!</p>
                        </>
                      ) : (
                        <>
                          <div className="winner-badge">🤝 Tie!</div>
                          <p>You use both AI systems equally!</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Comparison Insights */}
                {geminiPlaylists.length > 0 && spotifyAIPlaylists.length > 0 && (
                  <div className="insights-section">
                    <h3>💡 Insights</h3>
                    <div className="insights-grid">
                      <div className="insight-card">
                        <span className="insight-icon">⚡</span>
                        <div className="insight-content">
                          <div className="insight-label">Energy Difference</div>
                          <div className="insight-value">
                            {Math.abs(
                              Math.round((geminiFeatures?.energy || 0) * 100) - 
                              Math.round((spotifyFeatures?.energy || 0) * 100)
                            )}% {(geminiFeatures?.energy || 0) > (spotifyFeatures?.energy || 0) ? 
                              'higher in Gemini' : 'higher in Spotify'}
                          </div>
                        </div>
                      </div>

                      <div className="insight-card">
                        <span className="insight-icon">😊</span>
                        <div className="insight-content">
                          <div className="insight-label">Mood Variation</div>
                          <div className="insight-value">
                            {Math.abs(
                              Math.round((geminiFeatures?.valence || 0) * 100) - 
                              Math.round((spotifyFeatures?.valence || 0) * 100)
                            )}% difference in positivity
                          </div>
                        </div>
                      </div>

                      <div className="insight-card">
                        <span className="insight-icon">🎯</span>
                        <div className="insight-content">
                          <div className="insight-label">Recommendation</div>
                          <div className="insight-value">
                            {geminiPlaylists.length > spotifyAIPlaylists.length * 1.5 ? 
                              'Try Spotify AI for variety' : 
                            spotifyAIPlaylists.length > geminiPlaylists.length * 1.5 ?
                              'Try Gemini for flexibility' :
                              'Great balance!'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Moods */}
              <div className="moods-section">
                <h2 className="section-title">🎭 Your Top Moods</h2>
                <div className="moods-list">
                  {topMoods.map(([mood, count], index) => (
                    <div key={mood} className="mood-item">
                      <div className="mood-rank">#{index + 1}</div>
                      <div className="mood-name">{mood}</div>
                      <div className="mood-bar-container">
                        <div 
                          className="mood-bar-fill"
                          style={{ 
                            width: `${(count / topMoods[0][1]) * 100}%`,
                            background: `hsl(${(index * 60)}, 70%, 60%)`
                          }}
                        />
                      </div>
                      <div className="mood-count">{count} playlist{count !== 1 ? 's' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="activity-section">
                <h2 className="section-title">📅 Recent Activity</h2>
                <div className="activity-list">
                  {playlists.slice(0, 5).map((saved) => (
                    <div 
                      key={saved.id} 
                      className="activity-item"
                      onClick={() => navigate('/playlist', { 
                        state: { 
                          playlist: saved.playlist,
                          savedId: saved.id,
                          coverEmoji: saved.coverEmoji,
                          fromLibrary: true 
                        } 
                      })}
                    >
                      <div className="activity-emoji">{saved.coverEmoji}</div>
                      <div className="activity-info">
                        <div className="activity-title">{saved.playlist.mood || 'Untitled'}</div>
                        <div className="activity-meta">
                          {saved.playlist.songs.length} songs 
                        </div>
                      </div>
                      <div className="activity-arrow">→</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
