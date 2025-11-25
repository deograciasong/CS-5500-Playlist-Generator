import api, { API_URL } from './api';
import type { SpotifyUserProfile, User } from '../types';

const PKCE_VERIFIER_KEY = 'spotify_pkce_verifier';

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

async function createPkcePair() {
  const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(64)));
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);
  return { codeVerifier, codeChallenge };
}

function storeCodeVerifier(codeVerifier: string) {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
}

export function getStoredCodeVerifier() {
  return sessionStorage.getItem(PKCE_VERIFIER_KEY);
}

export function clearStoredCodeVerifier() {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
}

export const authService = {
  startSpotifyLogin: async (): Promise<string> => {
    const { codeVerifier, codeChallenge } = await createPkcePair();
    storeCodeVerifier(codeVerifier);
    return `${API_URL}/auth/login?code_challenge=${encodeURIComponent(codeChallenge)}&code_verifier=${encodeURIComponent(codeVerifier)}`;
  },

  getCurrentUser: async (): Promise<SpotifyUserProfile | User> => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (err: any) {
      // Fallback to Spotify profile if local auth isn't present
      const response = await api.get('/spotify/me');
      return response.data;
    }
  },

  loginLocal: async (payload: { email: string; password: string }) => {
    const response = await api.post('/auth/login-local', payload);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    clearStoredCodeVerifier();
  }
};
