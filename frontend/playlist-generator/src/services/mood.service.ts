import type { MoodProfile } from '../types/song.types';

// Predefined mood profiles based on Spotify audio features
const MOOD_PROFILES: Record<string, Omit<MoodProfile, 'name'>> = {
  happy: {
    valence: [0.6, 1.0],
    energy: [0.5, 1.0],
    danceability: [0.5, 1.0],
    tempo: [100, 180],
  },
  sad: {
    valence: [0.0, 0.4],
    energy: [0.0, 0.5],
    acousticness: [0.3, 1.0],
    tempo: [60, 100],
  },
  energetic: {
    valence: [0.5, 1.0],
    energy: [0.7, 1.0],
    danceability: [0.6, 1.0],
    tempo: [120, 200],
  },
  chill: {
    valence: [0.3, 0.7],
    energy: [0.2, 0.5],
    acousticness: [0.4, 1.0],
    tempo: [60, 110],
  },
  relaxed: {
    valence: [0.4, 0.7],
    energy: [0.1, 0.4],
    acousticness: [0.5, 1.0],
    instrumentalness: [0.3, 1.0],
  },
  workout: {
    valence: [0.5, 1.0],
    energy: [0.8, 1.0],
    danceability: [0.6, 1.0],
    tempo: [130, 180],
  },
  focus: {
    valence: [0.3, 0.6],
    energy: [0.2, 0.5],
    acousticness: [0.3, 0.7],
    instrumentalness: [0.5, 1.0],
  },
  party: {
    valence: [0.7, 1.0],
    energy: [0.7, 1.0],
    danceability: [0.7, 1.0],
    tempo: [110, 150],
  },
  romantic: {
    valence: [0.5, 0.8],
    energy: [0.2, 0.6],
    acousticness: [0.4, 0.9],
    tempo: [70, 110],
  },
  angry: {
    valence: [0.0, 0.4],
    energy: [0.7, 1.0],
    loudness: [-8, 0],
    tempo: [120, 180],
  },
};

// Mood keyword mapping
const MOOD_KEYWORDS: Record<string, string[]> = {
  happy: ['happy', 'upbeat', 'cheerful', 'joyful', 'positive', 'bright', 'sunny'],
  sad: ['sad', 'melancholy', 'somber', 'blue', 'depressed', 'rainy', 'gloomy'],
  energetic: ['energetic', 'high energy', 'pumped', 'intense', 'powerful', 'vigorous'],
  chill: ['chill', 'laid-back', 'mellow', 'easy', 'calm', 'smooth', 'lo-fi', 'lofi'],
  relaxed: ['relaxed', 'peaceful', 'tranquil', 'serene', 'ambient', 'soothing'],
  workout: ['workout', 'gym', 'exercise', 'training', 'fitness', 'running'],
  focus: ['focus', 'concentration', 'study', 'studying', 'work', 'productive', 'coding'],
  party: ['party', 'dance', 'club', 'celebration', 'fun', 'dancing'],
  romantic: ['romantic', 'love', 'date', 'intimate', 'tender', 'sweet'],
  angry: ['angry', 'rage', 'aggressive', 'fierce', 'mad', 'furious'],
};

/**
 * Analyzes user's mood description and returns a mood profile
 */
export function analyzeMood(input: string): MoodProfile {
  const lowerInput = input.toLowerCase();
  
  // Check for keyword matches
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some(keyword => lowerInput.includes(keyword))) {
      return {
        name: mood.charAt(0).toUpperCase() + mood.slice(1),
        ...MOOD_PROFILES[mood],
      };
    }
  }
  
  // Default to creating a custom profile based on descriptive words
  const profile: MoodProfile = {
    name: 'Custom',
    valence: [0.3, 0.7],
    energy: [0.3, 0.7],
    danceability: [0.3, 0.7],
  };
  
  // Adjust based on additional keywords
  if (lowerInput.match(/high.*tempo|fast|quick|rapid/)) {
    profile.tempo = [120, 180];
    profile.energy = [0.6, 1.0];
  }
  
  if (lowerInput.match(/slow|gentle|soft/)) {
    profile.tempo = [60, 100];
    profile.energy = [0.1, 0.4];
  }
  
  if (lowerInput.match(/acoustic|guitar|piano/)) {
    profile.acousticness = [0.5, 1.0];
  }
  
  if (lowerInput.match(/instrumental|no vocals|background/)) {
    profile.instrumentalness = [0.5, 1.0];
  }
  
  return profile;
}