// Authentication service for API calls
const API_URL = 'http://localhost:5000/api';

export const authService = {
  // Login with Spotify
  loginWithSpotify: () => {
    window.location.href = `${API_URL}/spotify/authorize`;
  },

  // Get current user
  getCurrentUser: async (token: string) => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  }
};