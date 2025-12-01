import express from 'express';
import aiService from '../services/ai-generator.service.js';
import { createSpotifyTokenManager } from './helpers/spotify-token-manager.js';
export const router = express.Router();
// POST /api/ai/playlists/generate
router.post('/playlists/generate', async (req, res) => {
    const tm = createSpotifyTokenManager(req, res);
    const length = Number(req.body?.length) || 30;
    const mood = req.body?.mood;
    try {
        const token = await tm.getAccessToken();
        const result = await aiService.generatePlaylistFromSpotify({ spotifyAccessToken: token, length, mood });
        return res.json({ ok: true, ...result });
    }
    catch (err) {
        // Detect missing scopes reported by Spotify and return a clear 403.
        const status = err?.response?.status || err?.status;
        const spotifyBody = err?.response?.data;
        const spotifyMsg = spotifyBody?.error_description || spotifyBody?.error || spotifyBody?.message || '';
        if (status === 403 && /scope|insufficient|requires scope/i.test(String(spotifyMsg))) {
            console.warn('Spotify returned 403 likely due to missing scopes:', spotifyMsg);
            return res.status(403).json({
                error: 'missing_spotify_scope',
                message: 'Your Spotify authorization is missing required scopes (user-library-read). Please re-link your Spotify account and grant the requested permissions.',
                upstream: spotifyMsg,
            });
        }
        // If the error came from Spotify with 401, try refreshing once then retry
        if (status === 401) {
            try {
                const newTokenData = await tm.refreshAccessToken();
                await tm.persistToken(newTokenData);
                const token = await tm.getAccessToken();
                const result = await aiService.generatePlaylistFromSpotify({ spotifyAccessToken: token, length, mood });
                return res.json({ ok: true, ...result });
            }
            catch (refreshErr) {
                console.error('Spotify token refresh failed', refreshErr?.message ?? refreshErr);
                const code = refreshErr?.code ?? 'spotify_refresh_failed';
                const message = refreshErr?.publicMessage ?? refreshErr?.message ?? 'Failed to refresh Spotify token';
                return res.status(401).json({ error: code, message });
            }
        }
        console.error('AI generator failed', err?.message ?? err);
        const code = err?.code ?? 'ai_generation_failed';
        const message = err?.publicMessage ?? err?.message ?? 'Internal server error';
        return res.status(500).json({ error: code, message });
    }
});
export default router;
//# sourceMappingURL=ai-generator.controller.js.map