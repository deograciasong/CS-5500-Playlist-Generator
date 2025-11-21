import type { MoodProfile } from '../types/song.types';

// Predefined mood profiles based on Spotify audio features
const MOOD_PROFILES: Record<string, MoodProfile> = {
  happy: {
    name: 'Happy',
    valence: [0.6, 1.0],
    energy: [0.5, 1.0],
    danceability: [0.5, 1.0],
    tempo: [100, 180],
  },
  sad: {
    name: 'Sad',
    valence: [0.0, 0.4],
    energy: [0.0, 0.5],
    acousticness: [0.3, 1.0],
    tempo: [60, 100],
  },
  energetic: {
    name: 'Energetic',
    valence: [0.5, 1.0],
    energy: [0.7, 1.0],
    danceability: [0.6, 1.0],
    tempo: [120, 200],
  },
  chill: {
    name: 'Chill',
    valence: [0.3, 0.7],
    energy: [0.2, 0.5],
    acousticness: [0.4, 1.0],
    tempo: [60, 110],
  },
  relaxed: {
    name: 'Relaxed',
    valence: [0.4, 0.7],
    energy: [0.1, 0.4],
    acousticness: [0.5, 1.0],
    instrumentalness: [0.3, 1.0],
  },
  workout: {
    name: 'Workout',
    valence: [0.5, 1.0],
    energy: [0.8, 1.0],
    danceability: [0.6, 1.0],
    tempo: [130, 180],
  },
  focus: {
    name: 'Focus',
    valence: [0.3, 0.6],
    energy: [0.2, 0.5],
    instrumentalness: [0.5, 1.0],
    acousticness: [0.3, 0.8],
  },
  party: {
    name: 'Party',
    valence: [0.7, 1.0],
    energy: [0.7, 1.0],
    danceability: [0.7, 1.0],
    tempo: [110, 160],
  },
  melancholic: {
    name: 'Melancholic',
    valence: [0.0, 0.3],
    energy: [0.0, 0.4],
    acousticness: [0.4, 1.0],
  },
  romantic: {
    name: 'Romantic',
    valence: [0.5, 0.8],
    energy: [0.2, 0.6],
    acousticness: [0.3, 0.8],
    danceability: [0.3, 0.7],
  },
};

// Keywords associated with each mood
const MOOD_KEYWORDS: Record<string, string[]> = {
  happy: ['happy', 'joy', 'cheerful', 'upbeat', 'positive', 'bright', 'sunny'],
  sad: ['sad', 'depressed', 'down', 'blue', 'melancholy', 'gloomy', 'crying'],
  energetic: ['energetic', 'hyper', 'intense', 'pumped', 'amped', 'powerful'],
  chill: ['chill', 'laid-back', 'easy', 'mellow', 'calm', 'cool', 'relaxing'],
  relaxed: ['relaxed', 'peaceful', 'serene', 'tranquil', 'soothing', 'gentle'],
  workout: ['workout', 'gym', 'exercise', 'training', 'fitness', 'running'],
  focus: ['focus', 'study', 'concentration', 'work', 'coding', 'productive'],
  party: ['party', 'dance', 'club', 'celebration', 'fun', 'wild'],
  melancholic: ['melancholic', 'nostalgic', 'wistful', 'longing', 'bittersweet'],
  romantic: ['romantic', 'love', 'intimate', 'sweet', 'tender', 'affection'],
};

// Music descriptors that affect audio features
const DESCRIPTORS = {
  tempo: {
    slow: [60, 90] as [number, number],  
    'mid-tempo': [90, 120] as [number, number],
    fast: [120, 160] as [number, number],
    'very fast': [160, 200] as [number, number],
  },
  energy: {
    calm: [0.0, 0.3],
    moderate: [0.3, 0.6],
    high: [0.6, 0.9],
    intense: [0.9, 1.0],
  },
  mood: {
    dark: { valence: [0.0, 0.3] },
    neutral: { valence: [0.3, 0.7] },
    bright: { valence: [0.7, 1.0] },
  }, 
} as const;

export class MoodAnalyzer {
  /**
   * Analyzes user input and returns a mood profile
   */
  static analyzeMood(input: string): MoodProfile {
    const lowerInput = input.toLowerCase();
    
    // Try to match predefined moods
    for (const [moodKey, keywords] of Object.entries(MOOD_KEYWORDS)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        return { ...MOOD_PROFILES[moodKey] };
      }
    }

    // If no direct match, create custom profile based on descriptors
    return this.createCustomProfile(lowerInput);
  }

  /**
   * Creates a custom mood profile based on descriptors in the input
   */
  private static createCustomProfile(input: string): MoodProfile {
    const profile: MoodProfile = {
      name: 'Custom',
      valence: [0.3, 0.7], // Default neutral
      energy: [0.3, 0.7],
    };

    // Check for tempo keywords
    if (input.includes('slow')) {
      profile.tempo = DESCRIPTORS.tempo.slow;
      profile.energy = [0.1, 0.4];
    } else if (input.includes('fast') || input.includes('upbeat')) {
      profile.tempo = DESCRIPTORS.tempo.fast;
      profile.energy = [0.6, 0.9];
    } else if (input.includes('mid-tempo') || input.includes('moderate')) {
      profile.tempo = DESCRIPTORS.tempo['mid-tempo'];
    }

    // Check for acoustic preference
    if (input.includes('acoustic') || input.includes('unplugged')) {
      profile.acousticness = [0.5, 1.0];
    }

    // Check for instrumental preference
    if (input.includes('instrumental') || input.includes('no vocals')) {
      profile.instrumentalness = [0.5, 1.0];
    }

    // Check for lo-fi
    if (input.includes('lo-fi') || input.includes('lofi')) {
      profile.valence = [0.4, 0.6];
      profile.energy = [0.2, 0.5];
      profile.acousticness = [0.3, 0.7];
    }

    // Check for vibe keywords
    if (input.includes('rainy') || input.includes('cozy')) {
      profile.valence = [0.3, 0.6];
      profile.energy = [0.2, 0.5];
      profile.acousticness = [0.4, 0.8];
    }

    return profile;
  }

  /**
   * Generates a playlist description based on mood profile
   */
  static generateDescription(profile: MoodProfile, input: string): string {
    return `A ${profile.name.toLowerCase()} playlist matching: "${input}"`;
  }
}