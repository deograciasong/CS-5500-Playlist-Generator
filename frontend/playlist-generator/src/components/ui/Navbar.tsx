import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onGetStarted?: () => void;
  showAuthButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onGetStarted, showAuthButton = true }) => {
  const navigate = useNavigate();

  return (
    <nav className="moodtune-nav">
      <div className="moodtune-logo" onClick={() => navigate('/')}>
        🎵 MoodTune
      </div>
      <ul className="nav-links">
        {/* <li><a href="#features">Features</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#pricing">Pricing</a></li> */}
      </ul>
      {showAuthButton && onGetStarted && (
        <button className="btn-primary" onClick={onGetStarted}>
          Login
        </button>
      )}
    </nav>
  );
};