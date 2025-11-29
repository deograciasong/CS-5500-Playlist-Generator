import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onGetStarted?: () => void;
  showAuthButton?: boolean;
  showAccount?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onGetStarted, showAuthButton = true, showAccount = true }) => {
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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {showAccount && (
          <button className="btn-secondary" onClick={() => navigate('/account')}>
            Account
          </button>
        )}
        {showAuthButton && onGetStarted && (
          <button className="btn-primary" onClick={onGetStarted}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
};