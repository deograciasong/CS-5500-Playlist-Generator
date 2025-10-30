// User authentication models
export interface User {
  id: string;
  email: string;
  displayName: string;
  spotifyId?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}