import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AccountSettingsSidebarProps {
  user: any;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsSidebar: React.FC<AccountSettingsSidebarProps> = ({
  user,
  activeSection,
  setActiveSection,
  onLogout,
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  
  const avatarUrl = user?.profileImage ?? user?.images?.[0]?.url ?? user?.image ?? null;
  const name = user?.displayName ?? user?.display_name ?? user?.name ?? 'Unnamed';
  const initial = name?.[0]?.toUpperCase() ?? 'U';

  const navItems = [
    { id: 'overview', label: 'Account overview' },
    { id: 'profile', label: 'Edit profile' },
    { id: 'security', label: 'Security settings' },

  ];

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    onClose(); // Close mobile menu after selection
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <div 
        style={{
          width: '280px',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '40px 0',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
          zIndex: 99
        }}
        className={`settings-sidebar ${isOpen ? 'open' : ''}`}
      >
        {/* User Profile Header */}
        <div style={{ padding: '0 30px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="avatar" 
                style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white'
              }}>{initial}</div>
            )}
            <div>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>{name}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>Premium</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              style={{
                width: '100%',
                padding: '14px 30px',
                background: activeSection === item.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: 'none',
                borderLeft: activeSection === item.id ? '3px solid #7c3aed' : '3px solid transparent',
                color: activeSection === item.id ? 'white' : 'rgba(255, 255, 255, 0.6)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '0.95rem',
                fontWeight: activeSection === item.id ? '600' : '400'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div style={{ 
          position: 'absolute', 
          bottom: '30px', 
          left: 0, 
          right: 0, 
          padding: '0 30px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px' 
        }}>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/dashboard')} 
            style={{ width: '100%' }}
          >
            Back to Dashboard
          </button>
          <button 
            className="btn-primary" 
            onClick={onLogout} 
            style={{ width: '100%' }}
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
};