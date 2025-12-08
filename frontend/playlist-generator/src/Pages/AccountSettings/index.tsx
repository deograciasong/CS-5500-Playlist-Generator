import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import type { User } from '../../types';
import { Background } from '../../components/ui/Background';
import { AccountSettingsSidebar } from '../../components/ui/AccountSettingsSidebar';
import '../../main.css';

export const AccountSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Password changing
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeStatus, setChangeStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (mounted) {
          setUser(u as User);
          // Initialize form fields with user data
          const anyU = u as any;
          setFormName(anyU?.displayName ?? anyU?.name ?? '');
          setFormEmail(anyU?.email ?? '');
        }
      } catch (err: any) {
        console.error('Failed to load user', err);
        if (mounted) setError(err?.response?.data?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUser();

    const onFocus = () => { loadUser(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') loadUser(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify_linked') === '1') {
      const sid = params.get('spotify_id');
      const sname = params.get('spotify_name');
      setUser((prev) => ({ 
        ...(prev as any), 
        spotifyId: sid ?? (prev as any)?.spotifyId, 
        spotifyProfile: { id: sid, display_name: sname } 
      } as User));
      
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  const handleLinkSpotify = async () => {
    try {
      const url = await authService.startSpotifyLogin();
      window.location.href = url;
    } catch (err: any) {
      console.error('Failed to start Spotify linking', err);
      setError(err?.message ?? 'Failed to start Spotify linking');
    }
  };

  const cancelEdit = () => {
    // Restore original values
    const anyU = user as any;
    setFormName(anyU?.displayName ?? anyU?.name ?? '');
    setFormEmail(anyU?.email ?? '');
    setIsEditing(false);
    setSaveStatus(null);
  };

  const saveProfile = async () => {
    try {
      setSaveStatus('saving');
      const updated = await authService.updateProfile({ name: formName, email: formEmail });
      setUser((prev) => ({ 
        ...(prev as any), 
        displayName: updated.name ?? updated.displayName ?? formName, 
        email: updated.email 
      } as User));
      // Update form fields with saved values
      setFormName(updated.name ?? updated.displayName ?? formName);
      setFormEmail(updated.email ?? formEmail);
      setSaveStatus('saved');
      setIsEditing(false);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Failed to save profile', err);
      setSaveStatus(err?.response?.data?.message ?? 'error');
    }
  };

  const cancelChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
    setChangeStatus(null);
  };

  const submitChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setChangeStatus('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setChangeStatus('New password must be at least 6 characters');
      return;
    }

    try {
      setChangeStatus('saving');
      await authService.changePassword({ currentPassword, newPassword });
      setChangeStatus('saved');
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      // Clear success message after 3 seconds
      setTimeout(() => setChangeStatus(null), 3000);
    } catch (err: any) {
      console.error('Failed to change password', err);
      setChangeStatus(err?.response?.data?.message ?? err?.message ?? 'Error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'white', fontSize: '1.2rem' }}>Error: {error}</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'white', fontSize: '1.2rem' }}>Not signed in</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go to Home</button>
      </div>
    );
  }

  const anyUser = user as any;
  const avatarUrl = anyUser?.profileImage ?? anyUser?.images?.[0]?.url ?? anyUser?.image ?? null;
  const name = anyUser?.displayName ?? anyUser?.display_name ?? user.displayName;
  const initial = name?.[0]?.toUpperCase() ?? 'U';
  const spotifyProfile = anyUser?.spotifyProfile;
  const spotifyId = anyUser?.spotifyId;

  return (
    <>
     <Background/>

      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-btn"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Sidebar Navigation */}
        <AccountSettingsSidebar 
          user={user}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={handleLogout}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="settings-content">
          
          {/* Account Overview Section */}
          {activeSection === 'overview' && (
            <div>
              <div style={{ marginBottom: '40px' }}>
                <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700', margin: '0 0 10px 0' }}>
                  Account overview
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                  Manage your account settings and preferences
                </p>
              </div>

              {/* Current Plan Card */}
              <div className="premium-card">
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '15px' }}>
                  CURRENT STATUS
                </div>
                <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700', margin: '0 0 20px 0' }}>
                  MoodTune Free
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '25px' }}>
                  Access to all features including mood-based playlist generation and Spotify integration.
                </p>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                    <span style={{ color: '#10b981' }}>✓</span> Unlimited playlist generation
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                    <span style={{ color: '#10b981' }}>✓</span> AI-powered mood analysis
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                    <span style={{ color: '#10b981' }}>✓</span> Spotify integration
                  </div>
                </div>

                <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: '700' }}>
                  Free
                  <span style={{ fontSize: '1rem', fontWeight: '400', color: 'rgba(255, 255, 255, 0.6)' }}> /month</span>
                </div>
              </div>

              {/* Spotify Connection Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '35px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', margin: '0 0 20px 0' }}>
                  Spotify Connection
                </h3>
                
                {spotifyId && spotifyProfile ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                      {spotifyProfile.images?.[0]?.url ? (
                        <img 
                          src={spotifyProfile.images[0].url} 
                          alt="spotify avatar" 
                          style={{ width: 50, height: 50, borderRadius: '50%' }} 
                        />
                      ) : (
                        <div style={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          background: '#1db954', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1.5rem'
                        }}>S</div>
                      )}
                      <div>
                        <div style={{ color: 'white', fontWeight: '600', fontSize: '1.1rem' }}>
                          {spotifyProfile.display_name ?? spotifyProfile.id}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
                          Connected to Spotify
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      color: '#10b981',
                      fontSize: '0.9rem'
                    }}>
                      ✓ Your Spotify account is linked and ready to use
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
                      Connect your Spotify account to generate personalized playlists directly from your library.
                    </p>
                    <button className="btn-primary" onClick={handleLinkSpotify}>
                      Connect Spotify Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit Profile Section */}
          {activeSection === 'profile' && (
            <div>
              <div style={{ marginBottom: '40px' }}>
                <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700', margin: '0 0 10px 0' }}>
                  Edit profile
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                  Update your profile information
                </p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '35px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {saveStatus && saveStatus !== 'saving' && (
                  <div className={saveStatus === 'saved' ? 'alert alert-success' : 'alert alert-error'}>
                    {saveStatus === 'saved' ? '✓ Profile updated successfully' : saveStatus}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input 
                    className="form-input" 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter your name" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    className="form-input" 
                    type="email"
                    value={formEmail} 
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Enter your email" 
                  />
                </div>


                <div className="form-actions">
                  <button 
                    className="btn-primary" 
                    onClick={saveProfile} 
                    disabled={saveStatus === 'saving'}
                  >
                    {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings Section */}
          {activeSection === 'security' && (
            <div>
              <div style={{ marginBottom: '40px' }}>
                <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700', margin: '0 0 10px 0' }}>
                  Security settings
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                  Manage your password and security preferences
                </p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '35px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '600', margin: '0 0 20px 0' }}>
                  Change Password
                </h3>

                {changeStatus && changeStatus !== 'saving' && (
                  <div className={changeStatus === 'saved' ? 'alert alert-success' : 'alert alert-error'}>
                    {changeStatus === 'saved' ? '✓ Password changed successfully' : changeStatus}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input 
                    className="form-input" 
                    type="password" 
                    placeholder="Enter current password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input 
                    className="form-input" 
                    type="password" 
                    placeholder="Enter new password (min 6 characters)" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input 
                    className="form-input" 
                    type="password" 
                    placeholder="Confirm new password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    className="btn-primary" 
                    onClick={submitChangePassword} 
                    disabled={changeStatus === 'saving'}
                  >
                    {changeStatus === 'saving' ? 'Changing...' : 'Change Password'}
                  </button>
                  <button className="btn-secondary" onClick={cancelChangePassword}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          
        </div>
      </div>
    </>
  );
};