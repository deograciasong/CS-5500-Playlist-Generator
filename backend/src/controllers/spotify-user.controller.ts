/**
 * Spotify User Controller
 * -----------------------------
 * - GET /me              → getCurrentUserProfile
 * - GET /me/playlists    → getCurrentUserPlaylists
 */

import type { Request, Response } from "express";
import {
  SpotifyApiError,
  createSpotifyApiClient,
} from "../lib/spotify-api.js";
import { createSpotifyTokenManager } from "./helpers/spotify-token-manager.js";
import {
  fetchCurrentUserProfile,
  fetchCurrentUserPlaylists,
} from "../services/spotify-user.service.js";

function buildSpotifyClient(req: Request, res: Response) {
  return createSpotifyApiClient(createSpotifyTokenManager(req, res));
}

function handleSpotifyError(res: Response, error: unknown) {
  if (error instanceof SpotifyApiError) {
    res.status(error.status).json({
      error: "spotify_api_error",
      message: error.message,
      details: error.payload,
    });
    return;
  }

  console.error("Spotify controller error", error);
  res.status(500).json({
    error: "internal_server_error",
    message: "Spotify request failed",
  });
}

/** Gets the current user's Spotify profile information. */
export const getCurrentUserProfile = async (req: Request, res: Response) => {
  try {
    const api = buildSpotifyClient(req, res);
    const profile = await fetchCurrentUserProfile(api);
    res.json(profile);
  } catch (error) {
    handleSpotifyError(res, error);
  }
};

/** Gets the current user's Spotify playlists. */
export const getCurrentUserPlaylists = async (
  req: Request,
  res: Response,
) => {
  const limit = Number.parseInt(String(req.query.limit ?? ""), 10);
  const offset = Number.parseInt(String(req.query.offset ?? ""), 10);

  try {
    const api = buildSpotifyClient(req, res);
    const playlists = await fetchCurrentUserPlaylists(api, {
      ...(Number.isNaN(limit) ? {} : { limit }),
      ...(Number.isNaN(offset) ? {} : { offset }),
    });
    res.json(playlists);
  } catch (error) {
    handleSpotifyError(res, error);
  }
};
