import { createSpotifyApiClient } from "../lib/spotify-api.js";
import crypto from 'crypto';
// @ts-ignore - Track model is a JS file without types
import TrackModel from "../models/Track.js";
import { createSpotifyTokenManager } from "./helpers/spotify-token-manager.js";
/**
 * Simple AI generator placeholder: fetches a user's saved tracks and
 * returns a lightweight playlist object that the frontend can render.
 */
export const generatePlaylistFromSpotify = async (req, res) => {
    try {
        const api = createSpotifyApiClient(createSpotifyTokenManager(req, res));
        // First request to learn total saved tracks
        const head = await api.get("/me/tracks?limit=1&offset=0");
        const total = typeof head.total === 'number' ? head.total : (Array.isArray(head.items) ? head.items.length : 0);
        const desired = 20;
        let songs = [];
        if (total === 0) {
            songs = [];
        }
        else if (total <= desired) {
            // Fetch all
            const all = await api.get(`/me/tracks?limit=${total}&offset=0`);
            const items = Array.isArray(all.items) ? all.items : [];
            songs = items.map((it) => it.track).filter(Boolean);
        }
        else {
            // Pick `desired` unique random offsets across [0, total-1]
            const picks = new Set();
            while (picks.size < desired) {
                const idx = Math.floor(Math.random() * total);
                picks.add(idx);
            }
            // Fetch each picked index individually (limit=1, offset=index)
            const fetches = Array.from(picks).map(async (offset) => {
                try {
                    const page = await api.get(`/me/tracks?limit=1&offset=${offset}`);
                    const item = Array.isArray(page.items) && page.items.length > 0 ? page.items[0] : null;
                    return item ? item.track : null;
                }
                catch (e) {
                    // ignore individual failures
                    return null;
                }
            });
            const results = await Promise.all(fetches);
            songs = results.filter(Boolean);
        }
        const sample = songs.slice(0, desired);
        // Fetch audio features for sampled tracks in one batch (up to 100)
        const ids = sample.map((t) => t.id).filter(Boolean);
        let featuresMap = {};
        if (ids.length > 0) {
            try {
                const featuresRes = await api.get(`/audio-features?ids=${ids.join(',')}`);
                const features = Array.isArray(featuresRes.audio_features) ? featuresRes.audio_features : featuresRes;
                if (Array.isArray(features)) {
                    features.forEach((f) => {
                        if (f && f.id)
                            featuresMap[f.id] = f;
                    });
                }
            }
            catch (e) {
                // ignore audio-features failure
                console.warn('Failed to fetch audio features for sample', e?.message ?? e);
            }
        }
        const mapped = sample.map((t) => {
            const f = featuresMap[t.id] ?? {};
            return {
                track_id: t.id,
                track_name: t.name,
                artists: (t.artists || []).map((a) => a.name).join(', '),
                track_genre: '',
                energy: typeof f.energy === 'number' ? f.energy : 0,
                valence: typeof f.valence === 'number' ? f.valence : 0,
                duration_ms: t.duration_ms ?? 0,
                spotify_uri: t.uri,
                album: t.album?.name ?? '',
                album_image: t.album?.images?.[0]?.url ?? null,
            };
        });
        // Now find 5 similar songs from our Track DB
        try {
            // Build centroid vector from sampled audio features
            const vectorKeys = [
                'danceability',
                'energy',
                'valence',
                'acousticness',
                'instrumentalness',
                'liveness',
                'speechiness',
                'tempo',
            ];
            const sampleFeatures = sample.map((t) => {
                const f = featuresMap[t.id] ?? {};
                const tempo = typeof f.tempo === 'number' ? f.tempo / 200 : 0; // normalize tempo
                return [
                    (f.danceability ?? 0),
                    (f.energy ?? 0),
                    (f.valence ?? 0),
                    (f.acousticness ?? 0),
                    (f.instrumentalness ?? 0),
                    (f.liveness ?? 0),
                    (f.speechiness ?? 0),
                    tempo,
                ];
            }).filter(arr => arr.length === vectorKeys.length);
            let centroid = Array(vectorKeys.length).fill(0);
            if (sampleFeatures.length > 0) {
                for (const vec of sampleFeatures) {
                    if (!vec)
                        continue;
                    for (let i = 0; i < vec.length; i++) {
                        centroid[i] = (centroid[i] ?? 0) + (vec[i] ?? 0);
                    }
                }
                centroid = centroid.map(v => v / sampleFeatures.length);
            }
            // Fetch candidate tracks from DB (only those with audioFeatures)
            const candidates = await TrackModel.find({ 'audioFeatures': { $exists: true } })
                .select('spotifyTrackId name artists durationMs audioFeatures album')
                .lean()
                .exec();
            const sampleIds = new Set(sample.map((t) => t.id));
            // Cosine similarity helper
            const dot = (a, b) => a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
            const norm = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));
            const scored = candidates.map((c) => {
                const af = c.audioFeatures || {};
                const tempo = typeof af.tempo === 'number' ? af.tempo / 200 : 0;
                const vec = [
                    (af.danceability ?? 0),
                    (af.energy ?? 0),
                    (af.valence ?? 0),
                    (af.acousticness ?? 0),
                    (af.instrumentalness ?? 0),
                    (af.liveness ?? 0),
                    (af.speechiness ?? 0),
                    tempo,
                ];
                const similarity = (norm(centroid) === 0 || norm(vec) === 0) ? 0 : dot(centroid, vec) / (norm(centroid) * norm(vec));
                return { candidate: c, similarity };
            })
                .filter((s) => s.candidate && !sampleIds.has(s.candidate.spotifyTrackId));
            scored.sort((a, b) => b.similarity - a.similarity);
            const top = scored.slice(0, 10).map((s) => s.candidate);
            // Pick up to 5 tracks and map to frontend shape, avoiding duplicates
            const added = [];
            for (const c of top) {
                if (added.length >= 5)
                    break;
                if (!c || !c.spotifyTrackId)
                    continue;
                if (sampleIds.has(c.spotifyTrackId))
                    continue;
                const af = c.audioFeatures || {};
                added.push({
                    track_id: c.spotifyTrackId,
                    track_name: c.name,
                    artists: (c.artists || []).map((a) => a.name).join(', '),
                    track_genre: '',
                    energy: (af.energy ?? 0),
                    valence: (af.valence ?? 0),
                    duration_ms: c.durationMs ?? 0,
                    spotify_uri: `spotify:track:${c.spotifyTrackId}`,
                    album: c.album?.name ?? '',
                    album_image: c.album?.images?.[0]?.url ?? null,
                });
            }
            const combined = mapped.concat(added);
            const playlistFinal = {
                mood: 'AI Playlist',
                description: 'Generated from your Spotify library (random sample + similar additions)',
                songs: combined,
            };
            return res.json({ playlist: playlistFinal });
        }
        catch (dbErr) {
            console.warn('Failed to load similar tracks from DB', dbErr?.message ?? dbErr);
            // Fallback to returning mapped sample only
            const fallback = {
                mood: 'AI Playlist',
                description: 'Generated from your Spotify library (random sample)',
                songs: mapped,
            };
            return res.json({ playlist: fallback });
        }
    }
    catch (err) {
        console.error('AI generate backend error', err);
        // If Spotify returned insufficient scope, return a clear 403 so frontend can prompt re-link
        const status = err?.status ?? err?.response?.status ?? 500;
        const payload = err?.payload ?? err?.response?.data ?? undefined;
        const msg = err?.message ?? payload?.message ?? 'Failed to generate playlist';
        if (status === 403 && payload) {
            const text = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
            if (text.includes('Insufficient client scope') || text.includes('insufficient_scope')) {
                // Attempt to generate a server-side PKCE pair and return an authorization URL
                try {
                    const clientId = process.env.SPOTIFY_CLIENT_ID;
                    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
                    const scope = "user-read-email user-read-private user-library-read playlist-modify-public playlist-modify-private";
                    const base64Url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                    const codeVerifier = base64Url(crypto.randomBytes(64));
                    const codeChallenge = base64Url(crypto.createHash('sha256').update(codeVerifier).digest());
                    const cookieSecure = process.env.COOKIE_SECURE !== 'false';
                    const baseCookie = {
                        httpOnly: true,
                        secure: cookieSecure,
                        sameSite: cookieSecure ? 'none' : 'lax',
                    };
                    res.cookie('spotify_code_verifier', codeVerifier, { ...baseCookie, maxAge: 10 * 60 * 1000 });
                    const rawState = crypto.randomBytes(16).toString('hex');
                    const redirectTarget = '/dashboard';
                    const state = `${rawState}|${encodeURIComponent(redirectTarget)}`;
                    res.cookie('spotify_auth_state', state, { ...baseCookie, maxAge: 10 * 60 * 1000 });
                    const authUrl = new URL('https://accounts.spotify.com/authorize');
                    authUrl.searchParams.set('client_id', clientId);
                    authUrl.searchParams.set('response_type', 'code');
                    authUrl.searchParams.set('redirect_uri', redirectUri);
                    authUrl.searchParams.set('state', state);
                    authUrl.searchParams.set('scope', scope);
                    authUrl.searchParams.set('code_challenge_method', 'S256');
                    authUrl.searchParams.set('code_challenge', codeChallenge);
                    return res.status(403).json({
                        error: 'insufficient_spotify_scope',
                        message: 'Spotify access token is missing required scopes. Reauthorization is required.',
                        reauthorizeUrl: authUrl.toString(),
                    });
                }
                catch (e) {
                    console.warn('Failed to construct reauthorize URL', e?.message ?? e);
                    return res.status(403).json({
                        error: 'insufficient_spotify_scope',
                        message: 'Spotify access token is missing required scopes (user-library-read). Please re-link your Spotify account and grant the requested permissions.'
                    });
                }
            }
        }
        return res.status(status).json({ error: 'ai_generate_failed', message: msg });
    }
};
//# sourceMappingURL=spotify-ai.controller.js.map