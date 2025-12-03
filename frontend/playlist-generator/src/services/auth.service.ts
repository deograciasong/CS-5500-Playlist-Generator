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
    // Clear any stale local bearer token so we rely solely on fresh cookies
    localStorage.removeItem('token');
    const { codeVerifier, codeChallenge } = await createPkcePair();
    storeCodeVerifier(codeVerifier);
    // If API_URL is a relative path (e.g. '/api') we're likely running with a dev proxy.
    // Redirecting the browser to a proxied URL can cause Set-Cookie headers from the
    // backend to not be stored correctly by the browser. Use an absolute backend host
    // in dev so cookies (spotify_code_verifier) are set on the backend origin before
    // redirecting to Spotify.
    // Use the app's API base so the request goes through the dev proxy (preserves cookies)
    const base = API_URL.replace(/\/$/, '');
    const redirect = encodeURIComponent(`${window.location.origin}/dashboard`);
    return `${base}/auth/login?code_challenge=${encodeURIComponent(codeChallenge)}&code_verifier=${encodeURIComponent(codeVerifier)}&redirect=${redirect}`;
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

  updateProfile: async (payload: { name?: string; email?: string }) => {
    const response = await api.put('/auth/me', payload);
    return response.data.user;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('/auth/me/password', payload);
    return response.status === 204 ? null : response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    clearStoredCodeVerifier();
  }
};
