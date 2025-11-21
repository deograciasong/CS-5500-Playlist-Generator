import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Background } from '../../components/ui/Background';
import { Navbar } from '../../components/ui/Navbar';
import { authService } from '../../services/auth.service';
import '../../main.css';


export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleAuthSuccess = (token: string) => {
    // Token is already saved in AuthModal
    navigate('/dashboard');
  };

  return (
    <>
      <Background />
      <Navbar onGetStarted={() => setAuthModalOpen(true)} />
      
      <div className="hero-section">
        <h1 className="hero-title">Transform Your Mood Into Music</h1>
        <p className="hero-subtitle">
          AI-powered playlist generation that understands your emotions. Just describe how you're feeling, 
          and we'll create the perfect soundtrack from your own Spotify library.
        </p>
        <button className="btn-cta" onClick={() => setAuthModalOpen(true)}>
          Get Started
        </button>
      </div>

      

  
    </>
  );
};