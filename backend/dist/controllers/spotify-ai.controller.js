import { createSpotifyApiClient } from "../lib/spotify-api.js";
import util from 'util';
import fs from 'fs';
function writeDebugLog(obj) {
    try {
        const p = '/tmp/spotify_audio_features_error.log';
        const entry = `[${new Date().toISOString()}] ${util.inspect(obj, { depth: null })}\n`;
        fs.appendFileSync(p, entry);
    }
    catch (e) {
        // swallow
    }
}
import crypto from 'crypto';
import analyzeVibeText from '../lib/vibe-analyzer.js';
// @ts-ignore - Track model is a JS file without types
import TrackModel from "../models/Track.js";
import { createSpotifyTokenManager } from "./helpers/spotify-token-manager.js";
/**
 * Simple AI generator placeholder: fetches a user's saved tracks and
 * returns a lightweight playlist object that the frontend can render.
 */
export const generatePlaylistFromSpotify = async (req, res) => {
    try {
        const tokenManager = createSpotifyTokenManager(req, res);
        const api = createSpotifyApiClient(tokenManager);
        // Try to proactively refresh the Spotify access token before heavy calls.
        // This helps when the access token is expired but a refresh token exists.
        if (typeof tokenManager.refreshAccessToken === 'function') {
            try {
                const refreshed = await tokenManager.refreshAccessToken();
                if (refreshed && typeof tokenManager.persistToken === 'function') {
                    try {
                        await tokenManager.persistToken(refreshed);
                    }
                    catch (pErr) {
                        console.warn('Failed to persist refreshed Spotify token', pErr?.message ?? pErr);
                    }
                }
                console.log('Spotify access token refreshed prior to AI generation');
            }
            catch (refreshErr) {
                console.warn('Spotify token refresh failed before AI generation', refreshErr?.message ?? refreshErr);
                // don't abort here — downstream calls will surface auth errors and
                // the controller will return a helpful reauthorize URL when needed.
            }
        }
        // If Spotify didn't return audio-features for some sampled songs, attempt
        // to populate `featuresMap` by matching tracks in our DB (spotifyTrackId
        // or name + first artist).
        const fillFeaturesFromDbForSample = async (sampleSongs, targetMap) => {
            try {
                const needIds = sampleSongs.map((s) => s.id).filter(Boolean).filter((id) => !targetMap[id]);
                if (needIds.length === 0)
                    return;
                // Bulk lookup by spotifyTrackId
                const found = await TrackModel.find({ spotifyTrackId: { $in: needIds } }).lean().exec();
                for (const f of found) {
                    const sid = f.spotifyTrackId;
                    if (sid) {
                        const af = f.audioFeatures || {};
                        // prefer explicit genre fields if present on the Track doc
                        const genre = f.genre || f.track_genre || f.trackGenre || (Array.isArray(f.genres) ? f.genres.join(', ') : '') || '';
                        targetMap[sid] = Object.assign({}, af, { track_genre: genre });
                    }
                }
                // Per-track fallback: name + first artist
                const remaining = sampleSongs.filter((t) => t.id && !targetMap[t.id]);
                for (const t of remaining) {
                    try {
                        const firstArtist = (t.artists && t.artists[0] && (t.artists[0].name || t.artists[0])) || '';
                        const cand = await TrackModel.findOne({ name: t.name, 'artists.name': firstArtist }).lean().exec();
                        if (cand) {
                            const af = cand.audioFeatures || {};
                            const genre = cand.genre || cand.track_genre || cand.trackGenre || (Array.isArray(cand.genres) ? cand.genres.join(', ') : '') || '';
                            targetMap[t.id] = Object.assign({}, af, { track_genre: genre });
                        }
                    }
                    catch (inner) {
                        // ignore
                    }
                }
            }
            catch (dbErr) {
                console.warn('Failed to fill sampled audio-features from DB', dbErr?.message ?? dbErr);
            }
        };
        // (deferred) will fill after we have `songs` and `featuresMap` in scope
        // Determine desired sample size and check for a vibe text request
        const desired = 20;
        const vibeText = (req.body && req.body.vibeText) || req.query?.vibeText;
        let songs = [];
        let targetVec = null;
        // If we see a 403 from Spotify audio-features, mark that we need reauthorization
        let reauthNeeded = false;
        const buildReauthorizeUrl = (res) => {
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
                return authUrl.toString();
            }
            catch (e) {
                console.warn('Failed to build reauthorize URL', e?.message ?? e);
                return null;
            }
        };
        // Global feature weighting to make prompt-derived valence/energy more influential
        const featureWeights = [1, 2.0, 2.0, 0.8, 0.6, 0.3, 0.3, 0.4];
        if (vibeText && vibeText.trim().length > 0) {
            // Use an external sentiment/vibe analyzer if configured, otherwise fall back
            // to the local heuristic in `vibe-analyzer.ts`.
            try {
                console.log('AI vibeText:', JSON.stringify(vibeText));
                targetVec = await analyzeVibeText(vibeText);
            }
            catch (e) {
                console.warn('vibe analyzer failed, falling back to local matching', e?.message ?? e);
                targetVec = null;
            }
            // Ensure we always have a non-zero compare vector (use neutral vector as fallback)
            if (!targetVec || !Array.isArray(targetVec) || targetVec.length === 0) {
                // neutral/default vector
                targetVec = [0.5, 0.5, 0.5, 0.5, 0.05, 0.1, 0.05, (60 + 0.5 * 140) / 200];
            }
            // Fetch a broader, randomized sample of the user's saved tracks (up to N pages)
            try {
                const head = await api.get('/me/tracks?limit=1&offset=0');
                const total = typeof head.total === 'number' ? head.total : 0;
                const pageSize = 50;
                const maxPages = Math.min(Math.ceil(total / pageSize) || 1, 6); // fetch up to 6 pages (up to 300 tracks)
                // Choose up to `maxPages` distinct page offsets randomly across the user's library
                const pageCount = Math.max(1, Math.min(maxPages, Math.ceil(total / pageSize)));
                const pageIndices = new Set();
                while (pageIndices.size < pageCount) {
                    const maxIndex = Math.max(0, Math.floor(total / pageSize) - 1);
                    const randPage = Math.floor(Math.random() * (maxIndex + 1));
                    pageIndices.add(randPage);
                }
                const pages = Array.from(pageIndices).map(pi => api.get(`/me/tracks?limit=${pageSize}&offset=${pi * pageSize}`));
                const pageResults = await Promise.all(pages);
                let userTracks = [];
                for (const p of pageResults) {
                    const items = Array.isArray(p.items) ? p.items : [];
                    userTracks = userTracks.concat(items.map((it) => it.track).filter(Boolean));
                }
                // Deduplicate by id
                const seenIds = new Set();
                userTracks = userTracks.filter((t) => {
                    if (!t || !t.id)
                        return false;
                    if (seenIds.has(t.id))
                        return false;
                    seenIds.add(t.id);
                    return true;
                });
                // Batch audio-features in chunks of 100
                const ids = userTracks.map((t) => t.id).filter(Boolean);
                const chunkSize = 100;
                const featuresMapLocal = {};
                for (let i = 0; i < ids.length; i += chunkSize) {
                    const chunk = ids.slice(i, i + chunkSize);
                    try {
                        const feats = await api.get(`/audio-features?ids=${chunk.join(',')}`);
                        const arr = Array.isArray(feats.audio_features) ? feats.audio_features : feats;
                        if (Array.isArray(arr)) {
                            arr.forEach((f) => { if (f && f.id)
                                featuresMapLocal[f.id] = f; });
                        }
                    }
                    catch (e) {
                        const se = e;
                        console.warn('Failed to fetch audio features chunk', se.status, se.payload?.error?.message ?? se.payload?.error ?? se.payload ?? se.message ?? se);
                        // log full error inspect to help debug 403 payloads (safe for circular structures)
                        try {
                            console.warn('Full spotify audio-features error:', util.inspect(se, { depth: null, colors: false }));
                            if (se && se.response) {
                                console.warn('Spotify audio-features response status:', se.response.status);
                                console.warn('Spotify audio-features response data:', util.inspect(se.response.data, { depth: null, colors: false }));
                                // persist to a file for easier retrieval from the environment
                                if (se.response && se.response.status === 403)
                                    reauthNeeded = true;
                                writeDebugLog({ type: 'chunk', response: se.response && se.response.data ? se.response.data : se });
                            }
                            else {
                                writeDebugLog({ type: 'chunk', error: se });
                            }
                        }
                        catch (logErr) {
                            // ignore logging errors
                        }
                    }
                }
                // If Spotify audio-features failed for some tracks (or returned partial results),
                // try to fill missing audio features by matching tracks in our Track DB
                // using `spotifyTrackId` or a fallback match by name + first artist.
                const fillFeaturesFromDb = async (tracks, targetMap) => {
                    try {
                        const needIds = tracks.map((t) => t.id).filter(Boolean).filter((id) => !targetMap[id]);
                        if (needIds.length === 0)
                            return;
                        // First try to find exact spotifyTrackId matches in bulk
                        const found = await TrackModel.find({ spotifyTrackId: { $in: needIds } }).lean().exec();
                        for (const f of found) {
                            const sid = f.spotifyTrackId;
                            if (sid) {
                                const af = f.audioFeatures || {};
                                const genre = f.genre || f.track_genre || f.trackGenre || (Array.isArray(f.genres) ? f.genres.join(', ') : '') || '';
                                targetMap[sid] = Object.assign({}, af, { track_genre: genre });
                            }
                        }
                        // For any remaining ids, try matching by name + first artist
                        const remaining = tracks.filter((t) => t.id && !targetMap[t.id]);
                        for (const t of remaining) {
                            try {
                                const firstArtist = (t.artists && t.artists[0] && (t.artists[0].name || t.artists[0])) || '';
                                const cand = await TrackModel.findOne({
                                    name: t.name,
                                    'artists.name': firstArtist,
                                }).lean().exec();
                                if (cand) {
                                    const sid = t.id;
                                    const af = cand.audioFeatures || {};
                                    const genre = cand.genre || cand.track_genre || cand.trackGenre || (Array.isArray(cand.genres) ? cand.genres.join(', ') : '') || '';
                                    targetMap[sid] = Object.assign({}, af, { track_genre: genre });
                                }
                            }
                            catch (inner) {
                                // ignore per-track lookup errors
                            }
                        }
                    }
                    catch (dbErr) {
                        console.warn('Failed to fill audio-features from DB', dbErr?.message ?? dbErr);
                    }
                };
                await fillFeaturesFromDb(userTracks, featuresMapLocal);
                // Weighted similarity: when a prompt-derived target vector exists, emphasize
                // valence and energy so the user's free-text sentiment has stronger effect.
                const featureWeights = [1, 2.0, 2.0, 0.8, 0.6, 0.3, 0.3, 0.4];
                const dotWeighted = (a, b, w) => a.reduce((s, v, i) => s + (w[i] ?? 1) * v * (b[i] ?? 0), 0);
                const normWeighted = (a, w) => Math.sqrt(a.reduce((s, v, i) => s + (w[i] ?? 1) * v * v, 0));
                const dot = (a, b) => a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
                const norm = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));
                const tv = targetVec ?? null;
                let scored = userTracks.map((t) => {
                    const f = featuresMapLocal[t.id] ?? {};
                    const tempo = typeof f.tempo === 'number' ? f.tempo / 200 : 0;
                    const vec = [
                        (f.danceability ?? 0),
                        (f.energy ?? 0),
                        (f.valence ?? 0),
                        (f.acousticness ?? 0),
                        (f.instrumentalness ?? 0),
                        (f.liveness ?? 0),
                        (f.speechiness ?? 0),
                        tempo,
                    ];
                    let similarity = 0;
                    if (tv) {
                        // use weighted cosine so valence/energy matter more for prompt-driven queries
                        const tnn = normWeighted(tv, featureWeights);
                        const vnn = normWeighted(vec, featureWeights);
                        if (tnn === 0 || vnn === 0)
                            similarity = 0;
                        else
                            similarity = dotWeighted(tv, vec, featureWeights) / (tnn * vnn);
                    }
                    else {
                        similarity = (vec[1] + vec[2]) / 2;
                    }
                    return { track: t, similarity, vec };
                }).filter((s) => s && s.track && s.track.id && typeof s.similarity === 'number');
                // Remove tracks with zero-vector (no audio features) to improve variety
                scored = scored.filter((s) => {
                    const v = s.vec || [];
                    const nonZero = v.some((x) => typeof x === 'number' && x !== 0);
                    return nonZero;
                });
                // If not enough tracks after filtering, keep what we have and proceed.
                // Previously we replaced scored with an unfiltered list (similarity=0),
                // which masked prompt-based ranking. Keep available scored items (may be
                // empty) and let DB filling add complementary tracks.
                if (scored.length < desired) {
                    console.warn('Not enough scored tracks after filtering audio features; available:', scored.length);
                }
                // Sort by similarity DESC
                scored.sort((a, b) => b.similarity - a.similarity);
                // To avoid always taking the same top-N, sample from topK candidates using weighted sampling
                const topK = Math.min(80, Math.max(desired, scored.length));
                const candidates = scored.slice(0, topK);
                // Build weights (normalize similarities to positive weights)
                const sims = candidates.map((c) => Math.max(0, c.similarity || 0));
                const minSim = Math.min(...sims);
                const eps = 1e-6;
                const weights = sims.map(s => (s - minSim) + eps);
                const totalWeight = weights.reduce((a, b) => a + b, 0);
                const chosen = [];
                const available = candidates.slice();
                const availableWeights = weights.slice();
                const pickOne = () => {
                    if (available.length === 0)
                        return null;
                    const tw = availableWeights.reduce((a, b) => a + b, 0);
                    let r = Math.random() * tw;
                    for (let i = 0; i < available.length; i++) {
                        const w = availableWeights[i] ?? 0;
                        r -= w;
                        if (r <= 0) {
                            const item = available.splice(i, 1)[0];
                            availableWeights.splice(i, 1);
                            if (item)
                                return item.track;
                            return null;
                        }
                    }
                    // fallback
                    const it = available.splice(0, 1)[0];
                    return it ? it.track : null;
                };
                while (chosen.length < desired && available.length > 0) {
                    const pick = pickOne();
                    if (!pick)
                        break;
                    chosen.push(pick);
                }
                songs = chosen.slice(0, desired);
            }
            catch (e) {
                console.warn('Failed to fetch user tracks for vibe matching', e?.message ?? e);
                songs = [];
            }
        }
        else {
            // First request to learn total saved tracks
            const head = await api.get("/me/tracks?limit=1&offset=0");
            const total = typeof head.total === 'number' ? head.total : (Array.isArray(head.items) ? head.items.length : 0);
            let sampled = [];
            if (total === 0) {
                sampled = [];
            }
            else if (total <= desired) {
                // Fetch all
                const all = await api.get(`/me/tracks?limit=${total}&offset=0`);
                const items = Array.isArray(all.items) ? all.items : [];
                sampled = items.map((it) => it.track).filter(Boolean);
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
                sampled = results.filter(Boolean);
            }
            songs = sampled.slice(0, desired);
        }
        // Fetch audio features for sampled Spotify tracks in one batch (up to 100)
        const ids = songs.map((t) => t.id).filter(Boolean);
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
                // ignore audio-features failure but log details to help debugging
                const se = e;
                console.warn('Failed to fetch audio features for sample', se?.message ?? se);
                try {
                    if (se && se.response) {
                        console.warn('Spotify audio-features (sample) response status:', se.response.status);
                        console.warn('Spotify audio-features (sample) response data:', JSON.stringify(se.response.data));
                        if (se.response && se.response.status === 403)
                            reauthNeeded = true;
                        writeDebugLog({ type: 'sample', response: se.response.data });
                    }
                    else {
                        writeDebugLog({ type: 'sample', error: se });
                    }
                }
                catch (logErr) {
                    // ignore
                }
            }
            // If Spotify failed to return features for some tracks, try filling from DB
            try {
                await fillFeaturesFromDbForSample(songs, featuresMap);
            }
            catch (fillErr) {
                // ignore
            }
        }
        const mapped = songs.map((t) => {
            const f = featuresMap[t.id] ?? {};
            const genreFromFeatures = f && (f.track_genre || f.genre || (Array.isArray(f.genres) ? f.genres.join(', ') : '')) || '';
            return {
                track_id: t.id,
                track_name: t.name,
                artists: (t.artists || []).map((a) => a.name).join(', '),
                track_genre: genreFromFeatures,
                energy: typeof f.energy === 'number' ? f.energy : 0,
                valence: typeof f.valence === 'number' ? f.valence : 0,
                duration_ms: t.duration_ms ?? 0,
                spotify_uri: t.uri,
                album: t.album?.name ?? '',
                album_image: t.album?.images?.[0]?.url ?? null,
            };
        });
        // If the user's saved tracks were fewer than desired, supplement with random
        // tracks from our Track DB so we can always return `desired` samples.
        if (mapped.length < desired) {
            try {
                const need = desired - mapped.length;
                const excludeIds = new Set(mapped.map(s => s.track_id).filter(Boolean));
                const extras = await TrackModel.aggregate([
                    { $match: { spotifyTrackId: { $exists: true } } },
                    { $sample: { size: need } },
                ]);
                for (const ex of extras) {
                    if (mapped.length >= desired)
                        break;
                    const sid = ex.spotifyTrackId;
                    if (!sid)
                        continue;
                    if (excludeIds.has(sid))
                        continue;
                    excludeIds.add(sid);
                    const af = ex.audioFeatures || {};
                    mapped.push({
                        track_id: sid,
                        track_name: ex.name || ex.title || 'Unknown',
                        artists: (ex.artists || []).map((a) => a.name).join(', '),
                        track_genre: ex.genre || '',
                        energy: (af.energy ?? 0),
                        valence: (af.valence ?? 0),
                        duration_ms: ex.durationMs ?? ex.duration_ms ?? 0,
                        spotify_uri: `spotify:track:${sid}`,
                        album: ex.album?.name ?? '',
                        album_image: ex.album?.images?.[0]?.url ?? null,
                    });
                }
            }
            catch (fillErr) {
                console.warn('Failed to fill missing sample tracks from DB', fillErr?.message ?? fillErr);
            }
        }
        // Now find 5 similar songs from our Track DB
        try {
            // Build centroid vector from sampled audio features (only used when no explicit targetVec)
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
            const sampleFeatures = mapped.map((m) => {
                // mapped entries include energy/valence for DB extras and Spotify tracks
                // For Spotify-origin entries, try featuresMap first
                const f = (featuresMap[m.track_id] ?? null) || (m && {
                    danceability: m.danceability,
                    energy: m.energy,
                    valence: m.valence,
                    acousticness: m.acousticness,
                    instrumentalness: m.instrumentalness,
                    liveness: m.liveness,
                    speechiness: m.speechiness,
                    tempo: m.tempo,
                }) || {};
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
            if (!targetVec) {
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
            }
            // Fetch candidate tracks from DB (only those with audioFeatures)
            const candidates = await TrackModel.find({ 'audioFeatures': { $exists: true } })
                .select('spotifyTrackId name artists durationMs audioFeatures album')
                .lean()
                .exec();
            const sampleIds = new Set(mapped.map((m) => m.track_id));
            // Weighted cosine similarity helpers (use same `featureWeights` declared above)
            const dotWeighted = (a, b, w) => a.reduce((s, v, i) => s + (w[i] ?? 1) * v * (b[i] ?? 0), 0);
            const normWeighted = (a, w) => Math.sqrt(a.reduce((s, v, i) => s + (w[i] ?? 1) * v * v, 0));
            // Choose vector to compare against: if a targetVec from the user's prompt exists,
            // use it; otherwise use the centroid computed from the sampled songs.
            const compareVec = targetVec ?? centroid;
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
                const similarity = (normWeighted(compareVec, featureWeights) === 0 || normWeighted(vec, featureWeights) === 0)
                    ? 0
                    : dotWeighted(compareVec, vec, featureWeights) / (normWeighted(compareVec, featureWeights) * normWeighted(vec, featureWeights));
                return { candidate: c, similarity };
            })
                .filter((s) => s.candidate && !sampleIds.has(s.candidate.spotifyTrackId));
            // Always log compareVec and top candidate similarities to help debug identical picks
            try {
                console.log('AI compareVec:', JSON.stringify(compareVec));
                const sampleTopDebug = scored
                    .slice(0, 20)
                    .map((s) => ({ id: s.candidate.spotifyTrackId, sim: Number(s.similarity.toFixed(4)), name: s.candidate.name }));
                console.log('AI top DB candidate sims:', JSON.stringify(sampleTopDebug, null, 2));
            }
            catch (dbgErr) {
                // ignore debug errors
            }
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
                const genre = c.genre || c.track_genre || c.trackGenre || (Array.isArray(c.genres) ? c.genres.join(', ') : '') || '';
                added.push({
                    track_id: c.spotifyTrackId,
                    track_name: c.name,
                    artists: (c.artists || []).map((a) => a.name).join(', '),
                    track_genre: genre,
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
                mood: 'AI',
                description: 'Generated from your Spotify library (with some we think you would like)',
                songs: combined,
            };
            console.log('AI generate returning description:', playlistFinal.description);
            const out = { playlist: playlistFinal };
            if (reauthNeeded) {
                const url = buildReauthorizeUrl(res);
                if (url)
                    out.reauthorizeUrl = url;
                else
                    out.reauthorizeRecommended = true;
            }
            return res.json(out);
        }
        catch (dbErr) {
            console.warn('Failed to load similar tracks from DB', dbErr?.message ?? dbErr);
            // Fallback to returning mapped sample only
            const fallback = {
                mood: 'AI',
                description: 'Generated from your Spotify library',
                songs: mapped,
            };
            console.log('AI generate returning fallback description:', fallback.description);
            const out = { playlist: fallback };
            if (reauthNeeded) {
                const url = buildReauthorizeUrl(res);
                if (url)
                    out.reauthorizeUrl = url;
                else
                    out.reauthorizeRecommended = true;
            }
            return res.json(out);
        }
    }
    catch (err) {
        console.error('AI generate backend error', err);
        // If Spotify returned insufficient scope, return a clear 403 so frontend can prompt re-link
        const status = err?.status ?? err?.response?.status ?? 500;
        const payload = err?.payload ?? err?.response?.data ?? undefined;
        const msg = err?.message ?? payload?.message ?? 'Failed to generate playlist';
        if (status === 403) {
            // If Spotify returned 403 for audio-features, offer a reauthorization flow.
            // Even if the payload wasn't explicit about insufficient scope, reauthorization
            // is the safest user-facing recovery: tokens may have lost scopes or otherwise
            // be invalid for the needed API surface.
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
                    error: 'insufficient_spotify_scope_or_invalid_token',
                    message: 'Spotify access token appears invalid or is missing required scopes. Reauthorization is recommended.',
                    reauthorizeUrl: authUrl.toString(),
                });
            }
            catch (e) {
                console.warn('Failed to construct reauthorize URL', e?.message ?? e);
                return res.status(403).json({
                    error: 'insufficient_spotify_scope',
                    message: 'Spotify access token may be missing required scopes (user-library-read). Please re-link your Spotify account and grant the requested permissions.'
                });
            }
        }
        return res.status(status).json({ error: 'ai_generate_failed', message: msg });
    }
};
//# sourceMappingURL=spotify-ai.controller.js.map