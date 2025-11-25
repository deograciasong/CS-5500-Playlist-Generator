export interface User {
  _id: string;
  spotifyId: string;
  displayName: string;
  email: string;
  profileImage?: string;
  preferences: {
    defaultDiscoveryPercent: number;
    autoSaveToSpotify: boolean;
    feedbackEnabled: boolean;
    defaultPlaylistLength: number;
  };
  createdAt: string;
  lastLoginAt: string;
}

export interface SpotifyUserProfile {
  id: string;
  display_name?: string | null;
  email?: string;
  country?: string;
  product?: string;
  images?: { url: string; height: number | null; width: number | null }[];
  href: string;
  uri: string;
  type: 'user';
}

export interface Track {
  spotifyTrackId: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration_ms: number;
  audioFeatures: {
    energy: number;
    tempo: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    danceability: number;
    speechiness?: number;
    loudness?: number;
  };
  position: number;
  matchScore: number;
}

export interface Playlist {
  _id: string;
  userId: string;
  moodInput: string;
  parsedConstraints: any;
  spotifyPlaylistId: string;
  spotifyPlaylistUrl: string;
  playlistName: string;
  tracks: Track[];
  feedback: {
    skips: string[];
    likes: string[];
    completionRate: number;
  };
  createdAt: string;
  isFavorite: boolean;
}
