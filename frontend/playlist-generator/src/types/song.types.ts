export interface Song {
  track_id: string;
  artists: string;
  album_name: string;
  track_name: string;
  popularity: number;
  duration_ms: number;
  explicit: boolean;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  time_signature: number;
  track_genre: string;
}

export interface MoodProfile {
  name: string;
  valence: [number, number]; // happiness [min, max]
  energy: [number, number]; // intensity
  danceability?: [number, number];
  acousticness?: [number, number];
  loudness?:[number,number];
  tempo?: [number, number];
  instrumentalness?: [number, number];
}

export interface PlaylistResult {
  mood: string;
  songs: Song[];
  description: string;
  cover_emoji?: string;
}
