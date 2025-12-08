import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { randomCoverEmoji, useSavedPlaylists } from '../../services/playlistStorage.service';
import { playlistService } from '../../services/playlist.service';
import { authService } from '../../services/auth.service';
import type { SpotifyUserProfile, User } from '../../types';
import type { PlaylistResult } from '../../types/song.types';
import '../../main.css';

export const Playlist: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationPlaylist = (location.state?.playlist as PlaylistResult | undefined) ?? null;
  const locationSavedId = (location.state as any)?.savedId as string | undefined;
  const locationCoverEmoji = (location.state as any)?.coverEmoji as string | undefined;
  
  // ✨ NEW: Gemini AI context
  const aiGenerated = Boolean((location.state as any)?.aiGenerated);
  const aiReasoning = (location.state as any)?.aiReasoning as string | undefined;
  const userInput = (location.state as any)?.userInput as string | undefined;
  
  const fromLibrary = Boolean((location.state as any)?.fromLibrary);
  const showSaveUI = !fromLibrary;
  const [playlist, setPlaylist] = useState<PlaylistResult | null>(locationPlaylist ?? null);
  const [savedId, setSavedId] = useState<string | undefined>(locationSavedId);
  const [coverEmoji, setCoverEmoji] = useState<string>(() => locationCoverEmoji ?? randomCoverEmoji());
  const { savePlaylist, deletePlaylist, updatePlaylist } = useSavedPlaylists({ autoLoad: false });
  const [titleInput, setTitleInput] = useState(playlist?.mood ?? '');
  const [descriptionInput, setDescriptionInput] = useState(playlist?.description ?? '');
  const [isSaved, setIsSaved] = useState(!!locationSavedId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [user, setUser] = useState<SpotifyUserProfile | User | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const canEditDetails = !!savedId;

  useEffect(() => {
    setPlaylist(locationPlaylist ?? null);
    setSavedId(locationSavedId);
    setIsSaved(!!locationSavedId);
    if (locationCoverEmoji) {
      setCoverEmoji(locationCoverEmoji);
    }
  }, [locationPlaylist, locationSavedId, locationCoverEmoji]);

  useEffect(() => {
    console.log('Playlist component mounted');
    console.log('Playlist data:', playlist);
    console.log('AI Generated:', aiGenerated);
    console.log('AI Reasoning:', aiReasoning);
  }, [playlist, aiGenerated, aiReasoning]);

  useEffect(() => {
    if (playlist) {
      setTitleInput(playlist.mood ?? '');
      setDescriptionInput(playlist.description ?? '');
    } else {
      setTitleInput('');
      setDescriptionInput('');
    }
  }, [playlist]);

  useEffect(() => {
    if (isEditingDetails && canEditDetails) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingDetails, canEditDetails]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await authService.getCurrentUser();
        setUser(profile);
      } catch (err) {
        console.error('Failed to load user profile', err);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleStartEditingDetails = () => {
    if (!canEditDetails) return;
    setIsEditingDetails(true);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleTitleChange = (value: string) => {
    setTitleInput(value);
    setUpdateError(null);
    setUpdateSuccess(false);
    setPlaylist((prev) => (prev ? { ...prev, mood: value } : prev));
  };

  const handleDescriptionChange = (value: string) => {
    setDescriptionInput(value);
    setUpdateError(null);
    setUpdateSuccess(false);
    setPlaylist((prev) => (prev ? { ...prev, description: value } : prev));
  };

  const handleSavePlaylist = async () => {
    if (!playlist) {
      setSaveError('No playlist data available');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      setUpdateError(null);
      setUpdateSuccess(false);
      const saved = await savePlaylist(playlist, coverEmoji);
      setPlaylist(saved.playlist);
      setSavedId(saved.id);
      setCoverEmoji(saved.coverEmoji);
      setIsSaved(true);
      
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ??
        (error as any)?.message ??
        'Failed to save playlist';
      setSaveError(message);
    }
    setIsSaving(false);
  };

  const handleDeletePlaylist = async () => {
    if (!savedId) {
      setDeleteError('Save the playlist before deletion');
      return;
    }

    if (!window.confirm('Delete this playlist?')) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deletePlaylist(savedId);
      navigate('/library');
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ??
        (error as any)?.message ??
        'Failed to delete playlist';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdatePlaylistDetails = async () => {
    if (!playlist) {
      setUpdateError('No playlist data available');
      return;
    }

    if (!savedId) {
      setUpdateError('Save the playlist before updating details');
      return;
    }

    try {
      setIsUpdatingDetails(true);
      setUpdateError(null);
      setUpdateSuccess(false);
      const updated = await updatePlaylist(savedId, {
        mood: playlist.mood,
        description: playlist.description,
      });
      setPlaylist(updated.playlist);
      setTitleInput(updated.playlist.mood ?? '');
      setDescriptionInput(updated.playlist.description ?? '');
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 2500);
      setIsEditingDetails(false);
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ??
        (error as any)?.message ??
        'Failed to update playlist details';
      setUpdateError(message);
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const handleViewLibrary = () => {
    console.log('Navigating to library...');
    navigate('/library');
  };

  const handleExportToSpotify = async () => {
    if (!playlist) {
      setExportError('No playlist data available');
      return;
    }

    setExportError(null);
    setIsExporting(true);
    setExportedUrl(null);

    try {
      const name = (playlist.mood && playlist.mood.trim().length > 0)
        ? playlist.mood
        : `MoodTune Playlist ${new Date().toLocaleDateString()}`;
      const description = playlist.description || '';
      const created = await playlistService.createSpotifyPlaylist({
        name,
        description,
        public: true,
      });

      const uris = playlist.songs.map((song) => `spotify:track:${song.track_id}`);
      if (uris.length > 0) {
        await playlistService.addTracksToSpotifyPlaylist(created.id, uris);
      }

      const url = created.external_urls?.spotify ?? `https://open.spotify.com/playlist/${created.id}`;
      setExportedUrl(url);
    } catch (error: any) {
      console.error('Failed to export playlist to Spotify', error);
      const serverBody = error?.response?.data;
      console.debug('Export error response body:', serverBody);
      const message = serverBody?.message ?? serverBody?.error ?? error?.message ?? 'Export failed';
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!playlist) {
    return (
      <>
        <div className="gradient-bg"></div>
        
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-button"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        
        {isMobileMenuOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        <div className={isMobileMenuOpen ? 'open' : ''}>
          <Sidebar 
            onLogin={() => {}} 
            onSignup={() => {}} 
            isAuthenticated={!!user} 
            onLogout={handleLogout} 
            user={user ?? undefined}
          />
        </div>
        
        <div className="playlist-page">
          <div className="playlist-error">
            <h2>No Playlist Found</h2>
            <p>Please generate a playlist from the dashboard first.</p>
            <button className="back-button" onClick={handleBack}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration_ms, 0);

  return (
    <>
      <div className="gradient-bg"></div>
      
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="mobile-menu-button"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>
      
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={isMobileMenuOpen ? 'open' : ''}>
        <Sidebar 
          onLogin={() => {}} 
          onSignup={() => {}} 
          isAuthenticated={!!user} 
          onLogout={handleLogout} 
          user={user ?? undefined}
        />
      </div>

      <div className="playlist-page">
        <button className="back-button" onClick={handleBack}>
          ← Back to Dashboard
        </button>
        <div className="playlist-content-inner">
          <div className="playlist-header-section">
            <div className="playlist-icon-large">{coverEmoji}</div>
            <div className="playlist-header-info">
              {canEditDetails && isEditingDetails ? (
                <>
                  <input
                    ref={titleInputRef}
                    className="playlist-title-input"
                    value={titleInput}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Playlist name"
                  />
                  <textarea
                    ref={descriptionInputRef}
                    className="playlist-description-input"
                    value={descriptionInput}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Add a short description for your playlist"
                  />
                </>
              ) : (
                <>
                  {(() => {
                    const raw = (titleInput || '').toString().trim();
                    if (/^ai(\s*playlist)?$/i.test(raw)) {
                      return <h1 className="playlist-main-title">AI Playlist</h1>;
                    }
                    if (raw.length === 0) {
                      return <h1 className="playlist-main-title">Untitled Playlist</h1>;
                    }
                    const hasPlaylist = /playlist/i.test(raw);
                    const title = hasPlaylist ? raw : `${raw} Playlist`;
                    return <h1 className="playlist-main-title">{title}</h1>;
                  })()}
                  
                  {/* ✨ AI-Generated Badge */}
                  {aiGenerated && (
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      marginTop: '8px',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'white',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      ✨ AI-Generated
                    </div>
                  )}
                  
                  <p className="playlist-description">
                    {descriptionInput && descriptionInput.trim().length > 0
                      ? descriptionInput
                      : 'Add a description to tell listeners what to expect.'}
                  </p>
                </>
              )}
              
              {/* ✨ NEW: Show AI Context if available */}
              {aiGenerated && userInput && !isEditingDetails && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    <span>💭</span>
                    <span>Your Request</span>
                  </div>
                  <p style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    color: 'white',
                    fontStyle: 'italic',
                    margin: '0 0 12px 0',
                    paddingLeft: '12px',
                    borderLeft: '3px solid rgba(102, 126, 234, 0.5)'
                  }}>
                    "{userInput}"
                  </p>
                  {aiReasoning && (
                    <>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        AI Analysis:
                      </div>
                      <p style={{
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        color: 'rgba(255, 255, 255, 0.8)',
                        margin: 0
                      }}>
                        {aiReasoning}
                      </p>
                    </>
                  )}
                </div>
              )}
              
              <p className="playlist-meta-info">
                {playlist.songs.length} songs • {formatDuration(totalDuration)}
              </p>

              <div className="playlist-actions-bar">
                <button className="playlist-action-btn primary">
                  <span>▶️</span> Play All
                </button>
                <button 
                  className="playlist-action-btn secondary"
                  onClick={handleExportToSpotify}
                  disabled={isExporting}
                >
                  <span>📤</span> {isExporting ? 'Exporting...' : 'Export to Spotify'}
                </button>
                {showSaveUI && (
                  <button 
                    className={`playlist-action-btn ${isSaved ? 'saved' : 'secondary'}`}
                    onClick={handleSavePlaylist}
                    disabled={isSaved || isSaving}
                  >
                    <span>{isSaved ? '✓' : '💾'}</span> {isSaved ? 'Saved!' : (isSaving ? 'Saving...' : 'Save Playlist')}
                  </button>
                )}
                {savedId && (
                  <button
                    className="playlist-action-btn secondary"
                    onClick={isEditingDetails ? handleUpdatePlaylistDetails : handleStartEditingDetails}
                    disabled={isUpdatingDetails}
                  >
                    <span>{isEditingDetails ? '💾' : '✏️'}</span> {isUpdatingDetails ? 'Saving...' : (isEditingDetails ? 'Save Changes' : 'Edit Details')}
                  </button>
                )}
                {savedId && (
                  <button
                    className="playlist-action-btn secondary"
                    onClick={handleDeletePlaylist}
                    disabled={isDeleting}
                  >
                    <span>🗑️</span> {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {showSaveUI && isSaved && (
            <div className="save-success-banner">
              Playlist saved to your library! 
              <button className="view-library-link" onClick={handleViewLibrary}>
                View Library
              </button>
            </div>
          )}

          {updateSuccess && (
            <div className="save-success-banner">
              Playlist details updated.
            </div>
          )}

          {/* Error Message */}
          {saveError && (
            <div className="save-error-banner">
              {saveError}
            </div>
          )}
          {updateError && (
            <div className="save-error-banner">
              {updateError}
            </div>
          )}

          {/* Export status */}
          {exportedUrl && (
            <div className="save-success-banner">
              Playlist exported to Spotify!{' '}
              <a href={exportedUrl} target="_blank" rel="noreferrer" className="view-library-link">
                Open in Spotify
              </a>
            </div>
          )}
          {exportError && (
            <div className="save-error-banner">
              {exportError}
            </div>
          )}
          {deleteError && (
            <div className="save-error-banner">
              {deleteError}
            </div>
          )}

          {/* Song List */}
          <div className="playlist-songs-container">
            <div className="playlist-songs-list">
              {playlist.songs.map((song, index) => (
                <div key={song.track_id} className="playlist-song-item">
                  <div className="song-item-number">{index + 1}</div>
                  
                  <div className="song-item-info">
                    <div className="song-item-title">{song.track_name}</div>
                    <div className="song-item-artist">{song.artists}</div>
                  </div>
                  
                  <div className="song-item-genre">
                    <span className="genre-tag">{song.track_genre}</span>
                  </div>
                  
                  <div className="song-item-stats">
                    <span className="stat-badge" title="Energy">
                      ⚡ {Math.round(song.energy * 100)}%
                    </span>
                    <span className="stat-badge" title="Happiness">
                      😊 {Math.round(song.valence * 100)}%
                    </span>
                  </div>
                  
                  <div className="song-item-duration">
                    {formatDuration(song.duration_ms)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};