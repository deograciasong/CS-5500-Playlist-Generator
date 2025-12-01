import type { Request, Response } from "express";
import { createSpotifyApiClient } from "../lib/spotify-api.js";
import { createSpotifyTokenManager } from "./helpers/spotify-token-manager.js";

/**
 * Simple AI generator placeholder: fetches a user's saved tracks and
 * returns a lightweight playlist object that the frontend can render.
 */
export const generatePlaylistFromSpotify = async (req: Request, res: Response) => {
  try {
    const api = createSpotifyApiClient(createSpotifyTokenManager(req, res));

    // Fetch first page of saved tracks (limit 50)
    const data = await api.get<any>("/me/tracks?limit=50");
    const items = Array.isArray(data.items) ? data.items : [];

    const songs = items
      .map((it: any) => it.track)
      .filter(Boolean)
      .map((t: any) => ({
        track_id: t.id,
        title: t.name,
        artist: (t.artists || []).map((a: any) => a.name).join(', '),
        duration_ms: t.duration_ms ?? 0,
        spotify_uri: t.uri,
        album: t.album?.name ?? '',
        album_image: t.album?.images?.[0]?.url ?? null,
      }));

    const playlist = {
      mood: 'AI Playlist',
      description: 'Generated from your Spotify library',
      songs,
    };

    return res.json({ playlist });
  } catch (err: any) {
    console.error('AI generate backend error', err);
    // If this is a Spotify API error it may include status info
    const status = err?.status ?? 500;
    return res.status(status).json({ error: 'ai_generate_failed', message: err?.message ?? 'Failed to generate playlist' });
  }
};
