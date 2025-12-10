import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { analyzeMood } from '../../services/mood.service';
import { filterSongsByMood } from '../../services/songRecommendation.service';
import { Background } from '../../components/ui/Background';
import { authService } from '../../services/auth.service';
import api from '../../services/api';
import { playlistService } from '../../services/playlist.service';
import type { SpotifyUserProfile, User } from '../../types';
import type { Song } from '../../types/song.types';
import '../../main.css';

const toolTabs = [
  '🎧 Mood Assistant',
  '⚡ Quick Vibe',
  '🎹 Mood Mix',
  '🤖 Let AI decide',
  '✨ Gemini AI', 
];

const examplePrompts = [
  'Create a chill lo-fi beats playlist perfect for late-night coding sessions',
  'Energetic workout mix with high tempo, motivating vibes for gym time',
  'Melancholic indie playlist for rainy days, soft vocals and acoustic guitars',
];

// Helper function to remove duplicate songs
const getUniqueSongs = (songs: Song[]) => {
  const seen = new Set<string>();
  return songs.filter(song => {
    if (seen.has(song.track_id)) {
      return false;
    }
    seen.add(song.track_id);
    return true;
  });
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SpotifyUserProfile | User | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [moodInput, setMoodInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedMoods, setSelectedMoods] = useState<{[key: string]: boolean}>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Gemini AI state 
  const [naturalInput, setNaturalInput] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    loadSongsData();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
    } catch (err) {
      console.error('Failed to load user:', err);
      navigate('/');
    } finally {
      setLoadingUser(false);
    }
  };

  const loadSongsData = async () => {
    try {
      const response = await fetch('/data/spotify_songs.json');
      
      if (!response.ok) {
        throw new Error('Failed to load songs dataset');
      }

      const songsData: Song[] = await response.json();
      setSongs(songsData);
      
      console.log(`Loaded ${songsData.length} songs from dataset`);
    } catch (error) {
      console.error('Error loading songs:', error);
      setError('Failed to load music library. Please check if the dataset is available.');
    }
  };

  const handleMoodSelect = (selectedMood: string) => {
    setMoodInput(selectedMood);
    setError('');
    setDetectedMood('');
    setAiReasoning('');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleGenerate = async (customInput?: string) => {
    const inputToUse = customInput || moodInput;

    if (!inputToUse.trim()) {
      setError('Please describe your mood first!');
      return;
    }

    if (songs.length === 0) {
      setError('Music library is still loading. Please wait...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Analyzing mood from input:', inputToUse);
      
      const moodProfile = analyzeMood(inputToUse);
      console.log('Mood profile:', moodProfile);
      
      const playlistSongs = filterSongsByMood(songs, moodProfile, 20);
      const uniquePlaylistSongs = getUniqueSongs(playlistSongs);
      console.log(`Generated playlist with ${uniquePlaylistSongs.length} unique songs`);
      
      if (uniquePlaylistSongs.length === 0) {
        setError('No songs found matching your mood. Try a different description!');
        setLoading(false);
        return;
      }

      const playlist = {
        mood: moodProfile.name,
        songs: uniquePlaylistSongs,
        description: inputToUse
      };
      
      setTimeout(() => {
        navigate('/playlist', { state: { playlist } });
      }, 500);
      
    } catch (error) {
      console.error('Error generating playlist:', error);
      setError('Failed to generate playlist. Please try again.');
      setLoading(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setMoodInput(prompt);
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    let name = 'User';
    
    if (user) {
      if ('displayName' in user && user.displayName) {
        name = user.displayName;
      } 
      else if ('display_name' in user && user.display_name) {
        name = user.display_name;
      }
      else if (user.email) {
        name = user.email.split('@')[0];
      }
      else if ('id' in user) {
        name = user.id;
      }
    }
    
    name = capitalizeFirstLetter(name);
    
    if (hour < 12) return `Good Morning, ${name}! 👋`;
    if (hour < 18) return `Good Afternoon, ${name}! 👋`;
    return `Good Evening, ${name}! 👋`;
  };

  const handleMoodMixGenerate = async () => {
    const activeMoods = Object.entries(selectedMoods)
      .filter(([_, isSelected]) => isSelected)
      .map(([mood, _]) => mood);

    if (activeMoods.length === 0) {
      setError('Please select at least one mood!');
      return;
    }

    if (songs.length === 0) {
      setError('Music library is still loading. Please wait...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const combinedMoodDescription = activeMoods.join(' and ');
      console.log('Mixing moods:', combinedMoodDescription);
      
      const moodProfile = analyzeMood(combinedMoodDescription);
      console.log('Combined mood profile:', moodProfile);
      
      const playlistSongs = filterSongsByMood(songs, moodProfile, 20);
      const uniquePlaylistSongs = getUniqueSongs(playlistSongs);
      
      console.log(`Generated mixed playlist with ${uniquePlaylistSongs.length} unique songs`);
      
      if (uniquePlaylistSongs.length === 0) {
        setError('No songs found matching your mood mix. Try different moods!');
        setLoading(false);
        return;
      }

      const playlist = {
        mood: `${moodProfile.name} Mix`,
        songs: uniquePlaylistSongs,
        description: `A blend of ${combinedMoodDescription}`
      };
      
      setTimeout(() => {
        navigate('/playlist', { state: { playlist } });
      }, 500);
      
    } catch (error) {
      console.error('Error generating mixed playlist:', error);
      setError('Failed to generate playlist. Please try again.');
      setLoading(false);
    }
  };

  const ensureSpotifyLinked = async (): Promise<boolean> => {
    try {
      await api.get('/spotify/me');
      return true;
    } catch (err: any) {
      try {
        const refreshRes = await api.post('/auth/refresh');
        if (refreshRes.status === 204) {
          await api.get('/spotify/me');
          return true;
        }
      } catch (refreshErr) {
        // ignore
      }
      return false;
    }
  };

  // Spotify AI Generation
  const handleAIGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const linked = await ensureSpotifyLinked();
      if (!linked) {
        setLoading(false);
        setError('Please link your Spotify account to use AI generation.');
        const url = await authService.startSpotifyLogin();
        window.location.href = url;
        return;
      }

      const vibeText = moodInput && moodInput.trim().length > 0 ? moodInput.trim() : undefined;
      const playlist = await playlistService.generateFromSpotify(vibeText);
      
      setTimeout(() => {
        navigate('/playlist', { state: { playlist } });
      }, 250);
    } catch (err: any) {
      console.error('AI generate error', err);

      const respData = err?.response?.data;
      const errCode = respData?.error ?? err?.code ?? null;
      const reauthUrl = respData?.reauthorizeUrl ?? respData?.reauthorize_url ?? null;

      if (errCode === 'insufficient_spotify_scope' && reauthUrl) {
        window.location.href = reauthUrl;
        return;
      }

      setError('Failed to generate AI playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Gemini AI Generation
  const handleGeminiGenerate = async () => {
    if (!naturalInput.trim()) {
      setError('Please describe how you feel');
      return;
    }

    setAiAnalyzing(true);
    setError('');

    try {
      const linked = await ensureSpotifyLinked();
      if (!linked) {
        setAiAnalyzing(false);
        setError('Please link your Spotify account to use AI generation.');
        const url = await authService.startSpotifyLogin();
        window.location.href = url;
        return;
      }

      // Use Spotify library to build the playlist with Gemini-driven matching
      const playlist = await playlistService.generateFromSpotifyWithGemini(naturalInput.trim());
      
      setTimeout(() => {
        navigate('/playlist', { 
          state: { 
            playlist,
            aiGenerated: true,
            userInput: naturalInput,
            coverEmoji: (playlist as any)?.cover_emoji
          } 
        });
      }, 500);
      
    } catch (err: any) {
      console.error('Gemini AI generation failed:', err);
      const respData = err?.response?.data;
      const errCode = respData?.error ?? err?.code ?? null;
      const reauthUrl = respData?.reauthorizeUrl ?? respData?.reauthorize_url ?? null;
      if (errCode === 'insufficient_spotify_scope' && reauthUrl) {
        window.location.href = reauthUrl;
        return;
      }
      setError('AI playlist generation failed. Please try again or reconnect Spotify.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => ({
      ...prev,
      [mood]: !prev[mood]
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Mood Assistant
        return (
          <>
            <div className="input-section">
              <div className="input-wrapper">
                <textarea
                  className="main-input"
                  placeholder="Describe your mood and we'll create the perfect playlist for you...

Example: 'Cozy rainy morning vibes, mid-tempo, acoustic, lo-fi beats for studying'"
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleGenerate();
                    }
                  }}
                  disabled={loading}
                />
                <button 
                  className="send-button" 
                  onClick={() => handleGenerate()}
                  disabled={loading || songs.length === 0}
                >
                  {loading ? (
                    <div className="spinner"></div>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="example-prompts">
              {examplePrompts.map((prompt, index) => (
                <div
                  key={index}
                  className="example-prompt"
                  onClick={() => handleExampleClick(prompt)}
                >
                  {prompt}
                </div>
              ))}
            </div>
          </>
        );

      case 1: // Quick Vibe
        return (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
              Select a Quick Vibe
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {[
                { label: '😌 Chill', prompt: 'Chill and relaxed vibes, lo-fi beats' },
                { label: '⚡ Energetic', prompt: 'Energetic and upbeat, high energy workout music' },
                { label: '😢 Sad', prompt: 'Sad and melancholic, emotional ballads' },
                { label: '😊 Happy', prompt: 'Happy and joyful, feel-good music' },
                { label: '🎯 Focus', prompt: 'Focus and concentration, ambient instrumental' },
                { label: '🎉 Party', prompt: 'Party and dance, high energy club music' }
              ].map((vibe) => (
                <button
                  key={vibe.label}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleGenerate(vibe.prompt)}
                  disabled={loading || songs.length === 0}
                >
                  {vibe.label}
                </button>
              ))}
            </div>
            {loading && (
              <div style={{ textAlign: 'center', color: 'white', marginTop: '1rem' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p>Creating your playlist...</p>
              </div>
            )}
          </div>
        );

      case 2: // Mood Mix
        return (
          <div style={{ marginTop: '2rem' }}>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '2rem', 
              textAlign: 'center' 
            }}>
              Select multiple moods to create a unique blended playlist
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {[
                { name: 'Chill', emoji: '😌', description: 'relaxed and calm' },
                { name: 'Energetic', emoji: '⚡', description: 'high energy and upbeat' },
                { name: 'Sad', emoji: '😢', description: 'melancholic and emotional' },
                { name: 'Happy', emoji: '😊', description: 'joyful and feel-good' },
                { name: 'Focus', emoji: '🎯', description: 'concentration and ambient' },
                { name: 'Party', emoji: '🎉', description: 'dance and celebration' },
              ].map((mood) => (
                <button
                  key={mood.name}
                  style={{
                    padding: '1.5rem 1rem',
                    background: selectedMoods[mood.description] 
                      ? 'rgba(139, 92, 246, 0.4)' 
                      : 'rgba(139, 92, 246, 0.1)',
                    border: selectedMoods[mood.description]
                      ? '2px solid rgba(139, 92, 246, 0.8)'
                      : '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onClick={() => toggleMood(mood.description)}
                >
                  <span style={{ fontSize: '2rem' }}>{mood.emoji}</span>
                  <span style={{ fontWeight: selectedMoods[mood.description] ? 'bold' : 'normal' }}>
                    {mood.name}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ 
              textAlign: 'center', 
              marginTop: '2rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9rem'
            }}>
              {Object.values(selectedMoods).filter(Boolean).length > 0 && (
                <p style={{ marginBottom: '1rem' }}>
                  Selected: {Object.entries(selectedMoods)
                    .filter(([_, isSelected]) => isSelected)
                    .map(([mood, _]) => mood)
                    .join(', ')}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                style={{
                  padding: '1rem 3rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '25px',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: Object.values(selectedMoods).filter(Boolean).length === 0 || loading ? 0.5 : 1
                }}
                onClick={handleMoodMixGenerate}
                disabled={Object.values(selectedMoods).filter(Boolean).length === 0 || loading || songs.length === 0}
              >
                {loading ? 'Creating Mix...' : 'Generate Mixed Playlist'}
              </button>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', color: 'white', marginTop: '1.5rem' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p>Blending your moods...</p>
              </div>
            )}
          </div>
        );

      case 3: // Let AI decide 
        return (
          <>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>
              Describe the vibe you want and let the AI will do the rest
            </p>
            <div className="input-section">
              <div className="input-wrapper">
                <textarea
                  className="main-input"
                  placeholder="Describe a vibe: e.g. 'chill, lo-fi, rainy evening with soft piano'"
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  rows={4}
                  style={{ width: '100%' }}
                  disabled={loading}
                />
                <button
                  className="send-button"
                  onClick={() => handleAIGenerate()}
                  disabled={loading}
                  aria-label="Generate from my vibe"
                >
                  {loading ? (
                    <div className="spinner"></div>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '20px',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
              onClick={handleAIGenerate}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate from my vibe'}
            </button>
          </>
        );

      case 4: // Gemini AI Tab
        return (
          <div style={{ marginTop: '2rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1.3rem' }}>
                  ✨ AI-Powered Mood Detection
                </h3>
                <span style={{
                  padding: '4px 10px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  POWERED BY GEMINI
                </span>
              </div>
              
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                Describe how you're feeling in natural language. Our AI will understand your mood and generate the perfect playlist.
              </p>

              <textarea
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '1rem'
                }}
                placeholder="Examples:
• 'I need something energetic for my morning workout'
• 'Looking for calm music to help me focus while studying'
• 'I want happy upbeat songs to brighten my day'
• 'Something chill for a rainy evening at home'"
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                disabled={aiAnalyzing}
              />

              <button
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: aiAnalyzing 
                    ? 'rgba(102, 126, 234, 0.5)' 
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: aiAnalyzing ? 'wait' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
                onClick={handleGeminiGenerate}
                disabled={aiAnalyzing || !naturalInput.trim() || songs.length === 0}
              >
                {aiAnalyzing ? (
                  <>
                    <div className="spinner"></div>
                    <span>AI is creating your playlist...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>Let AI Create My Playlist</span>
                  </>
                )}
              </button>

              {/* AI Detection Result */}
            </div>

            {/* Example Chips */}
            <div style={{ marginTop: '2rem' }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.9rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                💡 Try these examples:
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                {[
                  'I need energetic music for my gym workout',
                  'Something calm to help me focus while studying',
                  'I want happy upbeat music to brighten my day',
                  'Chill vibes for a relaxing evening at home'
                ].map((example, index) => (
                  <button
                    key={index}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: 'rgba(102, 126, 234, 0.2)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      borderRadius: '20px',
                      color: 'white',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setNaturalInput(example)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loadingUser) {
    return (
      <>
        <div className="gradient-bg"></div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: 'white'
        }}>
          Loading...
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

      <div className="main-content">
        <h1 className="greeting">{getGreeting()}</h1>

        <div className="tool-tabs">
          {toolTabs.map((tab, index) => (
            <div
              key={index}
              className={`tool-tab ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {tab}
            </div>
          ))}
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {renderTabContent()}
      </div>
    </>
  );
};
