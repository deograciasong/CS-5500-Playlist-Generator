import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../main.css';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: '🏠', label: 'Home', path: '/dashboard' },
  { icon: '✨', label: 'Generate', path: '/dashboard' },
  { icon: '📚', label: 'Library', path: '/library' },
  { icon: '📊', label: 'Analytics', path: '/analytics' },
  { icon: '🔍', label: 'Explore', path: '/explore' },
  { icon: '⭐', label: 'Premium', path: '/premium' },
];

interface SidebarProps {
  onLogin?: () => void;
  onSignup?: () => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  user?: any;
}

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
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              {(() => {
                const name = user?.displayName ?? user?.display_name ?? 'User';
                const initial = name.charAt(0).toUpperCase();
                return (
                  <>
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
