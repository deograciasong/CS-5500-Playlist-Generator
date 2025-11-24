import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';
import { PlaylistDisplay } from '../../components/ui/PlaylistDisplay';
import { SongRecommendationService } from '../../services/songRecommendation.service';
import type { User } from '../../types';
import type { Song, PlaylistResult } from '../../types/song.types';
import '../../main.css';

const toolTabs = [
  '🎧 Mood Assistant',
  '🎵 AI Playlist',
  '⚡ Quick Vibe',
  '🎹 Mood Mix',
  '🔀 Blend',
  '📻 Radio',
];

const examplePrompts = [
  'Create a chill lo-fi beats playlist perfect for late-night coding sessions',
  'Energetic workout mix with high tempo, motivating vibes for gym time',
  'Melancholic indie playlist for rainy days, soft vocals and acoustic guitars',
];

export const Dashboard: React.FC = () => {
  const [user] = useState<User | null>({ displayName: 'Jenny' } as User);
  const [activeTab, setActiveTab] = useState(1);
  const [moodInput, setMoodInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<PlaylistResult | null>(null);
  const [recommendationService, setRecommendationService] = useState<SongRecommendationService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSongsData();
  }, []);

  const loadSongsData = async () => {
    try {
      // Load the songs dataset
      // Replace this path with your actual dataset location
      const response = await fetch('/data/spotify_songs.json');
      
      if (!response.ok) {
        throw new Error('Failed to load songs dataset');
      }

      const songs: Song[] = await response.json();
      const service = new SongRecommendationService(songs);
      setRecommendationService(service);
      
      console.log('Loaded songs:', service.getStats());
    } catch (error) {
      console.error('Error loading songs:', error);
      setError('Failed to load music library. Please check if the dataset is available.');
    }
  };

  const handleLogout = () => {
    console.log('Logged out');
  };

  const handleGenerate = async () => {
    if (!moodInput.trim()) {
      setError('Please describe your mood first!');
      return;
    }

    if (!recommendationService) {
      setError('Music library is still loading. Please wait...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate a slight delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const playlist = recommendationService.generatePlaylist(moodInput, 20);
      
      if (playlist.songs.length === 0) {
        setError('No songs found matching your mood. Try a different description!');
      } else {
        setGeneratedPlaylist(playlist);
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      setError('Failed to generate playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setMoodInput(prompt);
  };

  const handleClosePlaylist = () => {
    setGeneratedPlaylist(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.displayName || 'there';
    if (hour < 12) return `Good Morning, ${name}! 👋`;
    if (hour < 18) return `Good Afternoon, ${name}! 👋`;
    return `Good Evening, ${name}! 👋`;
  };

  return (
    <>
      <div className="gradient-bg"></div>
      <Sidebar 
        onLogin={() => {}} 
        onSignup={() => {}} 
        isAuthenticated={true} 
        onLogout={handleLogout} 
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
              disabled={loading || !recommendationService}
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

      <div className="featured-section">
        <div className="featured-header">
          <h3>Your Recent Playlists</h3>
          <button className="play-all-btn">▶️ Play All</button>
        </div>
        <div className="featured-items">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="featured-item"></div>
          ))}
        </div>
      </div>

      {generatedPlaylist && (
        <PlaylistDisplay 
          playlist={generatedPlaylist} 
          onClose={handleClosePlaylist} 
        />
      )}
    </>
  );
};