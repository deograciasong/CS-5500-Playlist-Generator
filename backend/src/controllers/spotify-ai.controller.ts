import type { Request, Response } from "express";
import { createSpotifyApiClient } from "../lib/spotify-api.js";
import crypto from 'crypto';
import analyzeVibeText from '../lib/vibe-analyzer.js';
// @ts-ignore - Track model is a JS file without types
import TrackModel from "../models/Track.js";
import { createSpotifyTokenManager } from "./helpers/spotify-token-manager.js";
import {
  rankTracksWithGemini as serviceRankTracksWithGemini,
  estimateAudioFeaturesWithGemini as serviceEstimateAudioFeaturesWithGemini,
  generatePlaylistMetaWithGemini as serviceGeneratePlaylistMetaWithGemini,
  logGeminiDebug as serviceLogGeminiDebug,
} from "../services/gemini-playlist.service.js";

const COVER_EMOJIS = ["🎧", "🎵", "🌌", "🔥", "✨", "🌙", "💫", "🎶", "🌊", "☕️", "🌅", "🌃", "🏙️", "🌈", "⭐️"];

function pickCoverEmoji() {
  const idx = Math.floor(Math.random() * COVER_EMOJIS.length);
  return COVER_EMOJIS[idx] ?? "🎵";
}

async function fetchSavedTracks(api: any, pages: number): Promise<any[]> {
  const DEFAULT_PAGE_SIZE = 50;
  const offsets = Array.from({ length: pages }, (_v, i) => i * DEFAULT_PAGE_SIZE);
  const requests = offsets.map((off) => api.get(`/me/tracks?limit=${DEFAULT_PAGE_SIZE}&offset=${off}`));
  const results = await Promise.allSettled(requests);
  let tracks: any[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      const items = Array.isArray(r.value?.items) ? r.value.items : [];
      tracks = tracks.concat(items.map((it: any) => it.track).filter(Boolean));
    }
  }
  const seen = new Set<string>();
  return tracks.filter((t: any) => {
    if (!t?.id) return false;
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

export const generatePlaylistFromSpotifyGemini = async (req: Request, res: Response) => {
  const vibeText: string | undefined = (req.body && req.body.vibeText) || req.query?.vibeText;
  const desired = 20;

  if (!vibeText || vibeText.trim().length === 0) {
    res.status(400).json({ error: "missing_vibe_text", message: "vibeText is required for Gemini generation" });
    return;
  }

  try {
    const tokenManager = createSpotifyTokenManager(req, res);
    const api = createSpotifyApiClient(tokenManager);

    // Best-effort token refresh
    if (typeof tokenManager.refreshAccessToken === "function") {
      try {
        const refreshed = await tokenManager.refreshAccessToken();
        if (refreshed && typeof tokenManager.persistToken === "function") {
          await tokenManager.persistToken(refreshed);
        }
      } catch {
        // ignore
      }
    }

    const userTracks = await fetchSavedTracks(api, 2);
    if (userTracks.length === 0) {
      res.status(400).json({ error: "empty_library", message: "No saved tracks available in Spotify library" });
      return;
    }

    const { ids: rankedIds, features: rankedFeatures } = await serviceRankTracksWithGemini(vibeText, userTracks, desired);
    serviceLogGeminiDebug({
      stage: "rank_result",
      vibeText,
      rankedCount: rankedIds.length,
      usedFallback: rankedIds.length === 0,
    });

    const trackById: Record<string, any> = {};
    userTracks.forEach((t: any) => { if (t?.id) trackById[t.id] = t; });
    const chosen = (rankedIds.length > 0 ? rankedIds : userTracks.map((t: any) => t.id).slice(0, desired))
      .map((id: string) => trackById[id])
      .filter(Boolean)
      .slice(0, desired);

    const featuresMap: Record<string, any> = { ...rankedFeatures };
    let vibeVec: number[] | null = null;
    try {
      await serviceEstimateAudioFeaturesWithGemini(chosen, featuresMap);
    } catch {
      // ignore
    }
    try {
      const vec = await analyzeVibeText(vibeText);
      if (Array.isArray(vec)) vibeVec = vec;
    } catch {
      // ignore
    }

    // Fetch artist genres to enrich track_genre
    const artistIds = chosen
      .map((t: any) => (Array.isArray(t.artists) && t.artists[0] && t.artists[0].id) || null)
      .filter(Boolean) as string[];
    const artistGenreMap: Record<string, string> = {};
    if (artistIds.length > 0) {
      const unique = Array.from(new Set(artistIds));
      const chunkSize = 50;
      for (let i = 0; i < unique.length; i += chunkSize) {
        const chunk = unique.slice(i, i + chunkSize);
        try {
          const resArtists = await api.get<any>(`/artists?ids=${chunk.join(",")}`);
          const arr = Array.isArray(resArtists?.artists) ? resArtists.artists : [];
          arr.forEach((a: any) => {
            const gid = a?.id;
            const g = Array.isArray(a?.genres) && a.genres.length > 0 ? a.genres[0] : "";
            if (gid && g) artistGenreMap[gid] = g;
          });
        } catch {
          // ignore
        }
      }
    }

    const songs = chosen.map((t: any) => {
      const f = featuresMap[t.id] ?? {};
      const firstArtistId = Array.isArray(t.artists) && t.artists[0] && t.artists[0].id;
      const genre =
        (Array.isArray(t.album?.genres) && t.album.genres[0]) ||
        (Array.isArray(t.genres) && t.genres[0]) ||
        (firstArtistId && artistGenreMap[firstArtistId]) ||
        (typeof f.track_genre === "string" && f.track_genre) ||
        "";
      const fallbackEnergy = typeof vibeVec?.[1] === 'number' ? vibeVec[1] : 0.5;
      const fallbackValence = typeof vibeVec?.[2] === 'number' ? vibeVec[2] : 0.5;
      const fallbackDance = typeof vibeVec?.[0] === 'number' ? vibeVec[0] : undefined;
      const fallbackAcoustic = typeof vibeVec?.[3] === 'number' ? vibeVec[3] : undefined;
      const fallbackInstr = typeof vibeVec?.[4] === 'number' ? vibeVec[4] : undefined;
      const tempoNorm = typeof f.tempo === 'number' ? f.tempo / 200 : undefined;
      return {
        track_id: t.id,
        track_name: t.name,
        artists: (t.artists || []).map((a: any) => a.name).join(', '),
        track_genre: genre,
        energy: typeof f.energy === 'number' ? f.energy : fallbackEnergy,
        valence: typeof f.valence === 'number' ? f.valence : fallbackValence,
        danceability: typeof f.danceability === 'number' ? f.danceability : fallbackDance,
        acousticness: typeof f.acousticness === 'number' ? f.acousticness : fallbackAcoustic,
        instrumentalness: typeof f.instrumentalness === 'number' ? f.instrumentalness : fallbackInstr,
        tempo: typeof tempoNorm === 'number' ? tempoNorm : undefined,
        duration_ms: t.duration_ms ?? 0,
        spotify_uri: t.uri,
        album: t.album?.name ?? '',
        album_image: t.album?.images?.[0]?.url ?? null,
      };
    });

    let meta = { title: `Gemini AI: ${vibeText}`, description: `Gemini matched these from your library for "${vibeText}"`, emoji: pickCoverEmoji() };
    try {
      meta = await serviceGeneratePlaylistMetaWithGemini(vibeText, songs);
    } catch {
      // ignore meta failure
    }

    serviceLogGeminiDebug({
      stage: "final_songs",
      vibeText,
      count: songs.length,
      samples: songs.slice(0, 10).map((s: any) => ({
        id: s.track_id,
        name: s.track_name,
        energy: s.energy,
        valence: s.valence,
        danceability: s.danceability,
        acousticness: s.acousticness,
      })),
    });

    res.json({
      playlist: {
        mood: meta.title,
        description: meta.description,
        cover_emoji: meta.emoji,
        isGemini: true,
        generator: "gemini",
        source: "gemini",
        songs,
      },
    });
  } catch (err: any) {
    console.error("Gemini library generation failed", err);
    res.status(500).json({ error: "gemini_library_failed", message: "Unable to generate playlist from your library right now." });
  }
};

/**
 * Simple AI generator placeholder: fetches a user's saved tracks and
 * returns a lightweight playlist object that the frontend can render.
 */
export const generatePlaylistFromSpotify = async (req: Request, res: Response) => {
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
          } catch (pErr) {
            console.warn('Failed to persist refreshed Spotify token', (pErr as any)?.message ?? pErr);
          }
        }
        console.log('Spotify access token refreshed prior to AI generation');
      } catch (refreshErr) {
        console.warn('Spotify token refresh failed before AI generation', (refreshErr as any)?.message ?? refreshErr);
        // don't abort here — downstream calls will surface auth errors and
        // the controller will return a helpful reauthorize URL when needed.
      }
    }
    // If Spotify didn't return audio-features for some sampled songs, attempt
    // to populate `featuresMap` by matching tracks in our DB (spotifyTrackId
    // or name + first artist).
    const fillFeaturesFromDbForSample = async (sampleSongs: any[], targetMap: Record<string, any>) => {
      try {
        const needIds = sampleSongs.map((s: any) => s.id).filter(Boolean).filter((id: string) => !targetMap[id]);
        if (needIds.length === 0) return;

        // Bulk lookup by spotifyTrackId
        const found = await TrackModel.find({ spotifyTrackId: { $in: needIds } }).lean().exec();
        for (const f of found) {
          const sid = f.spotifyTrackId;
          if (sid) {
            const af = f.audioFeatures || {};
            // prefer explicit genre fields if present on the Track doc
            const genre = (f as any).genre || (f as any).track_genre || (f as any).trackGenre || (Array.isArray((f as any).genres) ? (f as any).genres.join(', ') : '') || '';
            targetMap[sid] = Object.assign({}, af, { track_genre: genre });
          }
        }

        // Per-track fallback: name + first artist
        const remaining = sampleSongs.filter((t: any) => t.id && !targetMap[t.id]);
        for (const t of remaining) {
          try {
            const firstArtist = (t.artists && t.artists[0] && (t.artists[0].name || t.artists[0])) || '';
            const cand = await TrackModel.findOne({ name: t.name, 'artists.name': firstArtist }).lean().exec();
            if (cand) {
              const af = (cand as any).audioFeatures || {};
              const genre = (cand as any).genre || (cand as any).track_genre || (cand as any).trackGenre || (Array.isArray((cand as any).genres) ? (cand as any).genres.join(', ') : '') || '';
              targetMap[t.id] = Object.assign({}, af, { track_genre: genre });
            }
          } catch (inner) {
            // ignore
          }
        }
      } catch (dbErr) {
        console.warn('Failed to fill sampled audio-features from DB', (dbErr as any)?.message ?? dbErr);
      }
    };

    // (deferred) will fill after we have `songs` and `featuresMap` in scope

    // Determine desired sample size and check for a vibe text request
    const desired = 20;
    const vibeText: string | undefined = (req.body && req.body.vibeText) || req.query?.vibeText;
    const vibeLabel = (vibeText && vibeText.trim().length > 0) ? vibeText.trim() : 'Let AI decide';

    let songs: any[] = [];
    let targetVec: number[] | null = null;
    // If we see a 403 from Spotify audio-features, mark that we need reauthorization
    let reauthNeeded = false;

    const buildPlaylistMeta = async (songList: any[], defaultDescription: string) => {
      const fallback = {
        title: `AI Playlist: ${vibeLabel}`,
        description: defaultDescription,
        emoji: pickCoverEmoji(),
      };

      try {
        return await serviceGeneratePlaylistMetaWithGemini(vibeLabel, songList);
      } catch {
        return fallback;
      }
    };

    const buildReauthorizeUrl = (res: Response) => {
      try {
        const clientId = process.env.SPOTIFY_CLIENT_ID!;
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
        const scope = "user-read-email user-read-private user-library-read playlist-modify-public playlist-modify-private";
        const base64Url = (buf: Buffer) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const codeVerifier = base64Url(crypto.randomBytes(64));
        const codeChallenge = base64Url(crypto.createHash('sha256').update(codeVerifier).digest());
        const cookieSecure = process.env.COOKIE_SECURE !== 'false';
        const baseCookie = {
          httpOnly: true,
          secure: cookieSecure,
          sameSite: cookieSecure ? 'none' : 'lax',
        } as any;
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
      } catch (e) {
        console.warn('Failed to build reauthorize URL', (e as any)?.message ?? e);
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
      } catch (e) {
        console.warn('vibe analyzer failed, falling back to local matching', (e as any)?.message ?? e);
        targetVec = null;
      }

      // Ensure we always have a non-zero compare vector (use neutral vector as fallback)
      if (!targetVec || !Array.isArray(targetVec) || targetVec.length === 0) {
        // neutral/default vector
        targetVec = [0.5, 0.5, 0.5, 0.5, 0.05, 0.1, 0.05, (60 + 0.5 * 140) / 200];
      }

      // Fetch a broader, randomized sample of the user's saved tracks (up to N pages)
      try {
        const head = await api.get<any>('/me/tracks?limit=1&offset=0');
        const total: number = typeof head.total === 'number' ? head.total : 0;
        const pageSize = 50;
        const maxPages = Math.min(Math.ceil(total / pageSize) || 1, 6); // fetch up to 6 pages (up to 300 tracks)

        // Choose up to `maxPages` distinct page offsets randomly across the user's library
        const pageCount = Math.max(1, Math.min(maxPages, Math.ceil(total / pageSize)));
        const pageIndices = new Set<number>();
        while (pageIndices.size < pageCount) {
          const maxIndex = Math.max(0, Math.floor(total / pageSize) - 1);
          const randPage = Math.floor(Math.random() * (maxIndex + 1));
          pageIndices.add(randPage);
        }

        const pages = Array.from(pageIndices).map(pi => api.get<any>(`/me/tracks?limit=${pageSize}&offset=${pi * pageSize}`));
        const pageResults = await Promise.all(pages);
        let userTracks: any[] = [];
        for (const p of pageResults) {
          const items = Array.isArray(p.items) ? p.items : [];
          userTracks = userTracks.concat(items.map((it: any) => it.track).filter(Boolean));
        }

        // Deduplicate by id
        const seenIds = new Set<string>();
        userTracks = userTracks.filter((t: any) => {
          if (!t || !t.id) return false;
          if (seenIds.has(t.id)) return false;
          seenIds.add(t.id);
          return true;
        });

        const featuresMapLocal: Record<string, any> = {};

        // If Spotify audio-features failed for some tracks (or returned partial results),
        // try to fill missing audio features by matching tracks in our Track DB
        // using `spotifyTrackId` or a fallback match by name + first artist.
        const fillFeaturesFromDb = async (tracks: any[], targetMap: Record<string, any>) => {
          try {
            const needIds = tracks.map((t: any) => t.id).filter(Boolean).filter((id: string) => !targetMap[id]);
            if (needIds.length === 0) return;

            // First try to find exact spotifyTrackId matches in bulk
            const found = await TrackModel.find({ spotifyTrackId: { $in: needIds } }).lean().exec();
            for (const f of found) {
              const sid = f.spotifyTrackId;
              if (sid) {
                const af = (f as any).audioFeatures || {};
                const genre = (f as any).genre || (f as any).track_genre || (f as any).trackGenre || (Array.isArray((f as any).genres) ? (f as any).genres.join(', ') : '') || '';
                targetMap[sid] = Object.assign({}, af, { track_genre: genre });
              }
            }

            // For any remaining ids, try matching by name + first artist
            const remaining = tracks.filter((t: any) => t.id && !targetMap[t.id]);
            for (const t of remaining) {
              try {
                const firstArtist = (t.artists && t.artists[0] && (t.artists[0].name || t.artists[0])) || '';
                const cand = await TrackModel.findOne({
                  name: t.name,
                  'artists.name': firstArtist,
                }).lean().exec();
                if (cand) {
                  const sid = t.id;
                  const af = (cand as any).audioFeatures || {};
                  const genre = (cand as any).genre || (cand as any).track_genre || (cand as any).trackGenre || (Array.isArray((cand as any).genres) ? (cand as any).genres.join(', ') : '') || '';
                  targetMap[sid] = Object.assign({}, af, { track_genre: genre });
                }
              } catch (inner) {
                // ignore per-track lookup errors
              }
            }
          } catch (dbErr) {
            console.warn('Failed to fill audio-features from DB', (dbErr as any)?.message ?? dbErr);
          }
        };

        await fillFeaturesFromDb(userTracks, featuresMapLocal);
        // If still missing, ask Gemini to estimate features so we can continue ranking.
        await serviceEstimateAudioFeaturesWithGemini(userTracks, featuresMapLocal);

        // Weighted similarity: when a prompt-derived target vector exists, emphasize
        // valence and energy so the user's free-text sentiment has stronger effect.
        const featureWeights = [1, 2.0, 2.0, 0.8, 0.6, 0.3, 0.3, 0.4];

        const dotWeighted = (a: number[], b: number[], w: number[]) => a.reduce((s, v, i) => s + (w[i] ?? 1) * v * (b[i] ?? 0), 0);
        const normWeighted = (a: number[], w: number[]) => Math.sqrt(a.reduce((s, v, i) => s + (w[i] ?? 1) * v * v, 0));
        const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
        const norm = (a: number[]) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));
        const tv = targetVec ?? null;

        let scored = userTracks.map((t: any) => {
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
            if (tnn === 0 || vnn === 0) similarity = 0; else similarity = dotWeighted(tv, vec, featureWeights) / (tnn * vnn);
          } else {
            similarity = (vec[1] + vec[2]) / 2;
          }
          return { track: t, similarity, vec };
        }).filter((s: any) => s && s.track && s.track.id && typeof s.similarity === 'number');

        // Remove tracks with zero-vector (no audio features) to improve variety
        scored = scored.filter((s: any) => {
          const v = s.vec || [];
          const nonZero = v.some((x: number) => typeof x === 'number' && x !== 0);
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
        scored.sort((a: any, b: any) => b.similarity - a.similarity);

        // To avoid always taking the same top-N, sample from topK candidates using weighted sampling
        const topK = Math.min(80, Math.max(desired, scored.length));
        const candidates = scored.slice(0, topK);

        // Build weights (normalize similarities to positive weights)
        const sims = candidates.map((c: any) => Math.max(0, c.similarity || 0));
        const minSim = Math.min(...sims);
        const eps = 1e-6;
        const weights = sims.map(s => (s - minSim) + eps);
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const chosen: any[] = [];
        const available = candidates.slice();
        const availableWeights = weights.slice();

        const pickOne = () => {
          if (available.length === 0) return null;
          const tw = availableWeights.reduce((a, b) => a + b, 0);
          let r = Math.random() * tw;
          for (let i = 0; i < available.length; i++) {
            const w = availableWeights[i] ?? 0;
            r -= w;
            if (r <= 0) {
              const item = available.splice(i, 1)[0];
              availableWeights.splice(i, 1);
              if (item) return item.track;
              return null;
            }
          }
          // fallback
          const it = available.splice(0, 1)[0];
          return it ? it.track : null;
        };

        while (chosen.length < desired && available.length > 0) {
          const pick = pickOne();
          if (!pick) break;
          chosen.push(pick);
        }

        songs = chosen.slice(0, desired);
      } catch (e) {
        console.warn('Failed to fetch user tracks for vibe matching', (e as any)?.message ?? e);
        songs = [];
      }
    } else {
      // First request to learn total saved tracks
      const head = await api.get<any>("/me/tracks?limit=1&offset=0");
      const total: number = typeof head.total === 'number' ? head.total : (Array.isArray(head.items) ? head.items.length : 0);

      let sampled: any[] = [];

      if (total === 0) {
        sampled = [];
      } else if (total <= desired) {
        // Fetch all
        const all = await api.get<any>(`/me/tracks?limit=${total}&offset=0`);
        const items = Array.isArray(all.items) ? all.items : [];
        sampled = items.map((it: any) => it.track).filter(Boolean);
      } else {
        // Pick `desired` unique random offsets across [0, total-1]
        const picks = new Set<number>();
        while (picks.size < desired) {
          const idx = Math.floor(Math.random() * total);
          picks.add(idx);
        }

        // Fetch each picked index individually (limit=1, offset=index)
        const fetches = Array.from(picks).map(async (offset) => {
          try {
            const page = await api.get<any>(`/me/tracks?limit=1&offset=${offset}`);
            const item = Array.isArray(page.items) && page.items.length > 0 ? page.items[0] : null;
            return item ? item.track : null;
          } catch (e) {
            // ignore individual failures
            return null;
          }
        });

        const results = await Promise.all(fetches);
        sampled = results.filter(Boolean) as any[];
      }

      songs = sampled.slice(0, desired);
    }

    // Fill audio features without calling Spotify's deprecated endpoint
    let featuresMap: Record<string, any> = {};
    try {
      await fillFeaturesFromDbForSample(songs, featuresMap);
    } catch {
      // ignore DB lookup failures
    }
    // Use Gemini estimation to supply missing features so frontend still gets energy/valence.
    await serviceEstimateAudioFeaturesWithGemini(songs, featuresMap);
    const mapped = songs.map((t: any) => {
      const f = featuresMap[t.id] ?? {};
      const genreFromFeatures = f && (f.track_genre || f.genre || (Array.isArray(f.genres) ? f.genres.join(', ') : '')) || '';
      return {
        track_id: t.id,
        track_name: t.name,
        artists: (t.artists || []).map((a: any) => a.name).join(', '),
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
          if (mapped.length >= desired) break;
          const sid = ex.spotifyTrackId;
          if (!sid) continue;
          if (excludeIds.has(sid)) continue;
          excludeIds.add(sid);
          const af = ex.audioFeatures || {};
          mapped.push({
            track_id: sid,
            track_name: ex.name || ex.title || 'Unknown',
            artists: (ex.artists || []).map((a: any) => a.name).join(', '),
            track_genre: ex.genre || '',
            energy: (af.energy ?? 0),
            valence: (af.valence ?? 0),
            duration_ms: ex.durationMs ?? ex.duration_ms ?? 0,
            spotify_uri: `spotify:track:${sid}`,
            album: ex.album?.name ?? '',
            album_image: ex.album?.images?.[0]?.url ?? null,
          });
        }
      } catch (fillErr) {
        console.warn('Failed to fill missing sample tracks from DB', (fillErr as any)?.message ?? fillErr);
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

      const sampleFeatures: number[][] = mapped.map((m: any) => {
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

      let centroid: number[] = Array(vectorKeys.length).fill(0);
      if (!targetVec) {
        if (sampleFeatures.length > 0) {
          for (const vec of sampleFeatures) {
            if (!vec) continue;
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

      const sampleIds = new Set(mapped.map((m: any) => m.track_id));

      // Weighted cosine similarity helpers (use same `featureWeights` declared above)
      const dotWeighted = (a: number[], b: number[], w: number[]) => a.reduce((s, v, i) => s + (w[i] ?? 1) * v * (b[i] ?? 0), 0);
      const normWeighted = (a: number[], w: number[]) => Math.sqrt(a.reduce((s, v, i) => s + (w[i] ?? 1) * v * v, 0));

      // Choose vector to compare against: if a targetVec from the user's prompt exists,
      // use it; otherwise use the centroid computed from the sampled songs.
      const compareVec = targetVec ?? centroid;

      const scored = candidates.map((c: any) => {
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
      .filter((s: any) => s.candidate && !sampleIds.has(s.candidate.spotifyTrackId));
      // Always log compareVec and top candidate similarities to help debug identical picks
      try {
        console.log('AI compareVec:', JSON.stringify(compareVec));
        const sampleTopDebug = scored
          .slice(0, 20)
          .map((s: any) => ({ id: s.candidate.spotifyTrackId, sim: Number(s.similarity.toFixed(4)), name: s.candidate.name }));
        console.log('AI top DB candidate sims:', JSON.stringify(sampleTopDebug, null, 2));
      } catch (dbgErr) {
        // ignore debug errors
      }

      scored.sort((a: any, b: any) => b.similarity - a.similarity);
      const top = scored.slice(0, 10).map((s: any) => s.candidate);

      // Pick up to 5 tracks and map to frontend shape, avoiding duplicates
      const added: any[] = [];
        for (const c of top) {
        if (added.length >= 5) break;
        if (!c || !c.spotifyTrackId) continue;
        if (sampleIds.has(c.spotifyTrackId)) continue;
        const af = c.audioFeatures || {};
          const genre = c.genre || c.track_genre || c.trackGenre || (Array.isArray(c.genres) ? c.genres.join(', ') : '') || '';
          added.push({
          track_id: c.spotifyTrackId,
          track_name: c.name,
          artists: (c.artists || []).map((a: any) => a.name).join(', '),
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

      const meta = await buildPlaylistMeta(
        combined,
        'Generated from your Spotify library (with some we think you would like)'
      );

      const playlistFinal = {
        mood: meta.title,
        description: meta.description,
        cover_emoji: meta.emoji,
        songs: combined,
      };

      console.log('AI generate returning description:', playlistFinal.description);
      const out: any = { playlist: playlistFinal };
      if (reauthNeeded) {
        const url = buildReauthorizeUrl(res);
        if (url) out.reauthorizeUrl = url; else out.reauthorizeRecommended = true;
      }
      return res.json(out);
    } catch (dbErr) {
      console.warn('Failed to load similar tracks from DB', (dbErr as any)?.message ?? dbErr);
      // Fallback to returning mapped sample only
      const meta = await buildPlaylistMeta(mapped, 'Generated from your Spotify library');
      const fallback = {
        mood: meta.title,
        description: meta.description,
        cover_emoji: meta.emoji,
        songs: mapped,
      };
      console.log('AI generate returning fallback description:', fallback.description);
      const out: any = { playlist: fallback };
      if (reauthNeeded) {
        const url = buildReauthorizeUrl(res);
        if (url) out.reauthorizeUrl = url; else out.reauthorizeRecommended = true;
      }
      return res.json(out);
    }
  } catch (err: any) {
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
        const clientId = process.env.SPOTIFY_CLIENT_ID!;
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
        const scope = "user-read-email user-read-private user-library-read playlist-modify-public playlist-modify-private";

        const base64Url = (buf: Buffer) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const codeVerifier = base64Url(crypto.randomBytes(64));
        const codeChallenge = base64Url(crypto.createHash('sha256').update(codeVerifier).digest());

        const cookieSecure = process.env.COOKIE_SECURE !== 'false';
        const baseCookie = {
          httpOnly: true,
          secure: cookieSecure,
          sameSite: cookieSecure ? 'none' : 'lax',
        } as any;

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
      } catch (e) {
        console.warn('Failed to construct reauthorize URL', (e as any)?.message ?? e);
        return res.status(403).json({
          error: 'insufficient_spotify_scope',
          message: 'Spotify access token may be missing required scopes (user-library-read). Please re-link your Spotify account and grant the requested permissions.'
        });
      }
    }

    return res.status(status).json({ error: 'ai_generate_failed', message: msg });
  }
};
