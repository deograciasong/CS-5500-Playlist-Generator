import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { SpotifyUserProfile, User } from '../../types/index.ts';
import '../../main.css';


interface NavItem {
  icon: string;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: '🏠', label: 'Home', path: '/dashboard' },
  { icon: '📚', label: 'Library', path: '/library' },
  { icon: '📊', label: 'Analytics', path: '/analytics' },
  { icon: '⭐', label: 'Premium', path: '/premium' },
];

interface SidebarProps {
  onLogin?: () => void;
  onSignup?: () => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  user?: any;
}

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

//helper function to check if user is SpotifyUserProfile
const isSpotifyUser = (user: any): user is SpotifyUserProfile => {
  return user && 'images' in user;
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  onLogin, 
  onSignup, 
  isAuthenticated = false,
  onLogout,
  user 
}) => {
  const navigate = useNavigate();
  const location = useLocation();


  return (
    <div className="sidebar">
      <div className="logo" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
        🎵 <span>MoodTune</span>
      </div>

      {navItems.map((item) => (
        <div
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}

       <div className="sidebar-bottom">
        {isAuthenticated ? (
          <div style={{ padding: '0 10px' }}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/account')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/account'); }}
              style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                marginBottom: '10px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              {(() => {
                let rawName = 'User';
                
                if (user) {
                  if ('displayName' in user && user.displayName) {
                    rawName = user.displayName;
                  } else if ('display_name' in user && user.display_name) {
                    rawName = user.display_name;
                  } else if (user.email) {
                    rawName = user.email.split('@')[0];
                  } else if ('id' in user) {
                    rawName = user.id;
                  }
                }
                
                const name = capitalizeFirstLetter(rawName);
                const initial = name.charAt(0).toUpperCase();
                
                // Type-safe image access
                let imageUrl = null;
                if (user) {
                  if ('profileImage' in user) {
                    imageUrl = user.profileImage;
                  } else if (isSpotifyUser(user) && user.images && user.images.length > 0) {
                    imageUrl = user.images[0].url;
                  }
                }

                return (
                  <>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'block',
                          objectFit: 'cover',
                          margin: '0 auto 8px'
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}>
                        {initial}
                      </div>
                    )}

                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      {name}
                    </div>
                  </>
                );
              })()}
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                Premium
              </div>
            </div>
            <button className="btn-login" onClick={onLogout} style={{ width: '100%' }}>
              Log Out
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn-login" onClick={onLogin}>
              Log In
            </button>
            <button className="btn-signup" onClick={onSignup}>
              Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
};