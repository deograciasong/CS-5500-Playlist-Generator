import React, { useState } from 'react';
import { authService } from '../../services/auth.service';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpotifyLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get Spotify auth URL from backend
      const authUrl = await authService.getSpotifyAuthUrl();
      
      // Redirect to Spotify for authentication
      window.location.href = authUrl;
    } catch (err) {
      console.error('Spotify login error:', err);
      setError('Failed to connect with Spotify. Please try again.');
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('Email login coming soon! Please use Spotify for now.');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="modal-content">
          <h2 className="modal-title">Welcome to MoodTune 🎵</h2>
          <p className="modal-subtitle">
            Sign in to create AI-powered playlists based on your mood
          </p>

          {error && (
            <div className="error-alert">
              ⚠️ {error}
            </div>
          )}

          {/* Spotify Login - Primary Option */}
          <button 
            className="spotify-login-button"
            onClick={handleSpotifyLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <svg className="spotify-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.101-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Continue with Spotify
              </>
            )}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          {/* Email Login Form - Secondary Option */}
          <form onSubmit={handleEmailLogin} className="email-form">
            <input 
              type="email" 
              placeholder="Email address" 
              className="input-field"
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="input-field"
              required
            />
            <button type="submit" className="submit-button">
              Sign In with Email
            </button>
          </form>

          <p className="signup-prompt">
            Don't have an account? <a href="#" className="signup-link">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};