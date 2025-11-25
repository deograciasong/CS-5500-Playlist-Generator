/**
 * Spotify Playlist Controller
 * -----------------------------
 * - POST   /playlists                     → createPlaylistHandler
 * - POST   /playlists/:playlistId/tracks  → addPlaylistTracksHandler
 * - PUT    /playlists/:playlistId/tracks  → replacePlaylistTracksHandler
 * - PUT    /playlists/:playlistId/tracks/reorder → reorderPlaylistTracksHandler
 */

import type { Request, Response } from "express";
import {
  SpotifyApiError,
  createSpotifyApiClient,
} from "../lib/spotify-api.js";
import { createSpotifyTokenManager } from "./helpers/spotify-token-manager.js";
import { isNonEmptyString } from "../lib/validation.js";
import type {
  CreatePlaylistDto,
  AddTracksDto,
  ReplaceTracksDto,
  ReorderTracksDto,
} from "../dto/spotify-playlists.dto.js";
import {
  addItemsToPlaylist,
  createPlaylist,
  reorderPlaylistItems,
  replacePlaylistItems,
} from "../services/spotify-playlist.service.js";
import { fetchCurrentUserProfile } from "../services/spotify-user.service.js";

/** Builds a Spotify API client using the token manager from the request and response. */
function buildSpotifyClient(req: Request, res: Response) {
  return createSpotifyApiClient(createSpotifyTokenManager(req, res));
}

/** Handles Spotify API errors and sends appropriate HTTP responses. */
function handleSpotifyError(res: Response, error: unknown) {
  if (error instanceof SpotifyApiError) {
    res.status(error.status).json({
      error: "spotify_api_error",
      message: error.message,
      details: error.payload,
    });
    return;
  }

  console.error("Spotify playlist controller error", error);
  res.status(500).json({
    error: "internal_server_error",
    message: "Spotify playlist request failed",
  });
}

/** Creates a new playlist for the user. */
export const createPlaylistForUser = async (req: Request, res: Response) => {
  const payload = req.body as Partial<CreatePlaylistDto>;

  const name = payload?.name;
  if (!isNonEmptyString(name)) {
    res.status(400).json({ error: "invalid_playlist_name" });
    return;
  }

  try {
    const api = buildSpotifyClient(req, res);
    // If userId not provided, fetch the current user profile from Spotify
    let targetUserId = payload?.userId;
    if (!isNonEmptyString(targetUserId)) {
      const profile = await fetchCurrentUserProfile(api);
      targetUserId = profile.id;
    }

    const playlist = await createPlaylist(api, targetUserId, {
      name,
      ...(payload.description ? { description: payload.description } : {}),
      ...(typeof payload.public === "boolean" ? { public: payload.public } : {}),
      ...(typeof payload.collaborative === "boolean"
        ? { collaborative: payload.collaborative }
        : {}),
    });
    res.status(201).json(playlist);
  } catch (error) {
    handleSpotifyError(res, error);
  }
};

/** Adds tracks to an existing playlist. */
export const addTracksToPlaylistHandler = async (
  req: Request,
  res: Response,
) => {
  const playlistIdParam = req.params.playlistId;
  const payload = req.body as Partial<AddTracksDto>;

  if (!isNonEmptyString(playlistIdParam)) {
    res.status(400).json({ error: "invalid_playlist_id" });
    return;
  }

  if (!payload?.uris || !Array.isArray(payload.uris) || payload.uris.length === 0) {
    res.status(400).json({ error: "invalid_track_uris" });
    return;
  }

  try {
    const api = buildSpotifyClient(req, res);
    const uris = payload.uris as string[];
    const snapshot = await addItemsToPlaylist(api, playlistIdParam, {
      uris,
      ...(typeof payload.position === "number" ? { position: payload.position } : {}),
    });
    res.status(201).json(snapshot);
  } catch (error) {
    handleSpotifyError(res, error);
  }
};

/** Replaces tracks in an existing playlist. */
export const replacePlaylistTracksHandler = async (
  req: Request,
  res: Response,
) => {
  const playlistIdParam = req.params.playlistId;
  const payload = req.body as Partial<ReplaceTracksDto>;

  if (!isNonEmptyString(playlistIdParam)) {
    res.status(400).json({ error: "invalid_playlist_id" });
    return;
  }

  if (!payload?.uris || !Array.isArray(payload.uris)) {
    res.status(400).json({ error: "invalid_track_uris" });
    return;
  }

  try {
    const api = buildSpotifyClient(req, res);
    const uris = payload.uris as string[];
    const snapshot = await replacePlaylistItems(api, playlistIdParam, {
      uris,
    });
    res.status(200).json(snapshot);
  } catch (error) {
    handleSpotifyError(res, error);
  }
};

/** Reorders tracks in an existing playlist. */
export const reorderPlaylistTracksHandler = async (
  req: Request,
  res: Response,
) => {
  const playlistIdParam = req.params.playlistId;
  const payload = req.body as Partial<ReorderTracksDto>;

  if (!isNonEmptyString(playlistIdParam)) {
    res.status(400).json({ error: "invalid_playlist_id" });
    return;
  }

  if (
    typeof payload?.rangeStart !== "number" ||
    typeof payload?.insertBefore !== "number"
  ) {
    res.status(400).json({ error: "invalid_reorder_payload" });
    return;
  }

  try {
    const api = buildSpotifyClient(req, res);
    const snapshot = await reorderPlaylistItems(api, playlistIdParam, {
      range_start: payload.rangeStart,
      insert_before: payload.insertBefore,
      ...(typeof payload.rangeLength === "number"
        ? { range_length: payload.rangeLength }
        : {}),
      ...(payload.snapshotId ? { snapshot_id: payload.snapshotId } : {}),
    });
    res.status(200).json(snapshot);
  } catch (error) {
    handleSpotifyError(res, error);
  }
};
