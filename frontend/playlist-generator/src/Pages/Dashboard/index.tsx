import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { analyzeMood } from '../../services/mood.service';
import { filterSongsByMood } from '../../services/songRecommendation.service';
import { authService } from '../../services/auth.service';
import type { SpotifyUserProfile, User } from '../../types';
import type { Song } from '../../types/song.types';
import '../../main.css';

const toolTabs = [
  '🎧 Mood Assistant',
  '🎵 AI Playlist',
  '⚡ Quick Vibe',
  '🎹 Mood Mix',
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
  const [activeTab, setActiveTab] = useState(1);
  const [moodInput, setMoodInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

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
      // Load the songs dataset
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

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleGenerate = async () => {
    if (!moodInput.trim()) {
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
      console.log('Analyzing mood from input:', moodInput);
      
      // Step 1: Analyze the mood from user's input
      const moodProfile = analyzeMood(moodInput);
      console.log('Mood profile:', moodProfile);
      
      // Step 2: Filter songs based on the mood profile
      const playlistSongs = filterSongsByMood(songs, moodProfile, 20);
      
      // Step 2.5: Remove duplicates
      const uniquePlaylistSongs = getUniqueSongs(playlistSongs);
      console.log(`Generated playlist with ${uniquePlaylistSongs.length} unique songs`);
      
      if (uniquePlaylistSongs.length === 0) {
        setError('No songs found matching your mood. Try a different description!');
        setLoading(false);
        return;
      }

      // Step 3: Create playlist object
      const playlist = {
        mood: moodProfile.name,
        songs: uniquePlaylistSongs,
        description: moodInput
      };
      
      // Step 4: Navigate to playlist page with the generated playlist
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.display_name || 'there';
    if (hour < 12) return `Good Morning, ${name}! 👋`;
    if (hour < 18) return `Good Afternoon, ${name}! 👋`;
    return `Good Evening, ${name}! 👋`;
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
      <div className="gradient-bg"></div>
      <Sidebar 
        onLogin={() => {}} 
        onSignup={() => {}} 
        isAuthenticated={!!user} 
        onLogout={handleLogout} 
        user={user} 
      />

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

        <div className="input-section">
          <div className="input-wrapper">
            <textarea
              className="main-input"
              placeholder="Describe your mood and we'll create the perfect playlist from your Spotify library...

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
              onClick={handleGenerate}
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
          <div className="input-options">
            <button className="option-btn">🔎 Attach Playlist</button>
            <button className="option-btn">⚙️ Custom Settings</button>
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
      </div>
    </>
  );
};
