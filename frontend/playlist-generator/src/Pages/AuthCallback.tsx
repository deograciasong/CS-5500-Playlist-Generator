import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Background } from '../components/ui/Background';
import '../main.css';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <>
      <Background />
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Authenticating...</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
            Please wait while we connect your Spotify account
          </p>
        </div>
      </div>
    </>
  );
};