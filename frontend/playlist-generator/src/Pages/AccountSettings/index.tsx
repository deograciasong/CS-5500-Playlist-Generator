import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import type { User } from '../../types';
import '../../main.css';

const AccountSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (mounted) setUser(u as User);
      } catch (err: any) {
        console.error('Failed to load user', err);
        if (mounted) setError(err?.response?.data?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeStatus, setChangeStatus] = useState<string | null>(null);

  const startEdit = () => {
    setFormName(((user as any)?.displayName ?? (user as any)?.name) ?? '');
    setFormEmail((user as any)?.email ?? '');
    setIsEditing(true);
    setSaveStatus(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSaveStatus(null);
  };

  const saveProfile = async () => {
    try {
      setSaveStatus('saving');
      const updated = await authService.updateProfile({ name: formName, email: formEmail });
      setUser((prev) => ({ ...(prev as any), displayName: updated.name ?? updated.displayName ?? formName, email: updated.email } as User));
      setSaveStatus('saved');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to save profile', err);
      setSaveStatus(err?.response?.data?.message ?? 'error');
    }
  };

  const startChangePassword = () => {
    setIsChangingPassword(true);
    setChangeStatus(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const cancelChangePassword = () => {
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
      setIsChangingPassword(false);
    } catch (err: any) {
      console.error('Failed to change password', err);
      setChangeStatus(err?.response?.data?.message ?? err?.message ?? 'Error');
    }
  };

  if (loading) return <div className="main-content" style={{ paddingTop: 120 }}>Loading account...</div>;
  if (error) return <div className="main-content" style={{ paddingTop: 120 }}>Error: {error}</div>;
  if (!user) return <div className="main-content" style={{ paddingTop: 120 }}>Not signed in.</div>;

  return (
    <div className="main-content">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="welcome">
            <h2>Account Settings</h2>
            <p className="text-muted">Manage your profile and preferences</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Back</button>
            <button className="btn-primary" onClick={handleLogout}>Log out</button>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {(() => {
            const anyUser = user as any;
            const avatarUrl = anyUser?.profileImage ?? anyUser?.images?.[0]?.url ?? anyUser?.image ?? null;
            const name = anyUser?.displayName ?? anyUser?.display_name ?? user.displayName ?? 'Unnamed';
            const initial = name?.[0]?.toUpperCase() ?? 'U';

            return (
              <>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="user-avatar" style={{ width: 96, height: 96 }} />
                ) : (
                  <div className="user-avatar" style={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{initial}</div>
                )}

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{name}</h3>
                  <div className="text-muted" style={{ marginTop: 6 }}>{user.email}</div>
                  <div style={{ marginTop: 12 }} className="text-muted">Member since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</div>

                  <div style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!isEditing ? (
                      <>
                        <button className="btn-secondary" onClick={startEdit}>Edit Profile</button>
                        <button className="btn-secondary" onClick={startChangePassword}>Change Password</button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input className="input-field" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Display name" />
                        <input className="input-field" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" />
                        <button className="btn-primary" onClick={saveProfile} disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Saving...' : 'Save'}</button>
                        <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                      </div>
                    )}
                    {saveStatus === 'saved' && <div style={{ marginLeft: 8, color: '#7c3aed' }}>Saved</div>}
                    {saveStatus && saveStatus !== 'saved' && saveStatus !== 'saving' && <div style={{ marginLeft: 8, color: '#ff6b6b' }}>{String(saveStatus)}</div>}
                  </div>
                  {isChangingPassword && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input className="input-field" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                      <input className="input-field" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      <input className="input-field" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                      <button className="btn-primary" onClick={submitChangePassword} disabled={changeStatus === 'saving'}>{changeStatus === 'saving' ? 'Saving...' : 'Change'}</button>
                      <button className="btn-secondary" onClick={cancelChangePassword}>Cancel</button>
                      {changeStatus === 'saved' && <div style={{ marginLeft: 8, color: '#7c3aed' }}>Password changed</div>}
                      {changeStatus && changeStatus !== 'saved' && changeStatus !== 'saving' && <div style={{ marginLeft: 8, color: '#ff6b6b' }}>{String(changeStatus)}</div>}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        <div style={{ height: 20 }} />

        <div className="glass-card">
          <h4 style={{ marginTop: 0 }}>Preferences</h4>
          <div style={{ marginTop: 12 }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(user.preferences ?? {}, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
