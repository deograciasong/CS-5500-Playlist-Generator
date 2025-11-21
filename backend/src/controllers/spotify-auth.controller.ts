/**
 * Spotify Auth Controller
 * ------------------------------------
 * - GET  /auth/login     → builds /authorize URL (with PKCE) and redirects
 * - GET  /auth/callback  → exchanges code+verifier, stores tokens in httpOnly cookies, redirects app
 * - POST /auth/refresh   → uses refresh token cookie to get new access token, updates cookies
 */

import type { Request, Response, CookieOptions } from "express";
import {
  exchangeCodeForToken,
  refreshToken as refreshAccessToken,
} from "../services/spotify-auth.service.js";
import type {
  SpotifyTokenResponse,
  SpotifyErrorResponse,
} from "../types/spotify.js";
import axios from "axios";

const AUTH_URL = "https://accounts.spotify.com/authorize";
const clientId = process.env.SPOTIFY_CLIENT_ID!;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
const appRedirect = process.env.APP_REDIRECT_AFTER_LOGIN ?? "/";
const scope =
  "user-read-email user-read-private playlist-modify-public playlist-modify-private";

/** Cookie presets: httpOnly+secure; SameSite=Lax works for most same-site flows. */
const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
};

/** Generate CSRF state for /authorize */
function randomState(len = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/**
 * GET /auth/login
 * Redirects the browser to Spotify's /authorize (PKCE).
 */
export const login = (req: Request, res: Response) => {
  const codeChallenge = req.query.code_challenge as string | undefined;
  if (!codeChallenge) {
    res.status(400).json({ error: "missing_code_challenge" });
    return;
  }

  const state = randomState(20);
  res.cookie("spotify_auth_state", state, {
    ...baseCookie,
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scope);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", codeChallenge);

  res.redirect(url.toString());
};

/**
 * GET /auth/callback
 * Exchanges code+code_verifier for tokens, sets httpOnly cookies, and redirects to the app.
 */
export const callback = async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const codeVerifier =
    (req.query.code_verifier as string | undefined) ??
    (req.body?.code_verifier as string | undefined);

  if (!code || !state || !codeVerifier) {
    res.status(400).json({
      error: "missing_params",
      details: { code: !!code, state: !!state, code_verifier: !!codeVerifier },
    });
    return;
  }

  // CSRF: verify state cookie
  const savedState = req.cookies?.spotify_auth_state as string | undefined;
  if (!savedState || savedState !== state) {
    res.status(400).json({ error: "state_mismatch" });
    return;
  }
  res.clearCookie("spotify_auth_state", baseCookie);

  // Runtime narrow helper
  const isToken = (
    body: SpotifyTokenResponse | SpotifyErrorResponse | any
  ): body is SpotifyTokenResponse =>
    body && typeof (body as SpotifyTokenResponse).access_token === "string";

  try {
    const r = await exchangeCodeForToken({
      code,
      redirectUri,
      clientId,
      codeVerifier,
    });

    console.debug("Spotify token endpoint response", {
      status: r.status,
      data: r.data,
      headers: r.headers,
    });

    // Upstream error passthrough
    if (r.status >= 400 || !isToken(r.data)) {
      const upstream = r.data as SpotifyErrorResponse | undefined;
      const upstreamStatus = r.status;

      if (upstreamStatus === 429) {
        const ra = (r.headers?.["retry-after"] ?? r.headers?.["Retry-After"]);
        if (ra) res.setHeader("Retry-After", String(ra));
      }

      console.error("Spotify token error", { status: upstreamStatus, body: upstream });
      res.status(upstreamStatus).json({
        error: "spotify_token_error",
        message:
          upstream?.error_description ?? upstream?.error ?? "Spotify token exchange failed",
        upstreamStatus,
      });
      return;
    }

    // Success
    const { access_token, refresh_token, expires_in } = r.data;

    res.cookie("spotify_access_token", access_token, {
      ...baseCookie,
      maxAge: expires_in * 1000,
    });

    if (refresh_token) {
      res.cookie("spotify_refresh_token", refresh_token, baseCookie);
    }

    res.redirect(appRedirect);
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      if (err.response) {
        const s = err.response.status;
        console.error("Spotify upstream error", { status: s, body: err.response.data });
        res.status(s >= 500 ? 502 : s).json({
          error: "spotify_token_error",
          message: err.response.data?.error_description ?? "Upstream server error",
          upstreamStatus: s,
        });
        return;
      }
      if (err.code === "ECONNABORTED") {
        console.error("Spotify request timed out");
        res.status(504).json({ error: "upstream_timeout", message: "Spotify request timed out" });
        return;
      }
      if (err.request && !err.response) {
        console.error("No response from Spotify");
        res.status(502).json({ error: "upstream_unavailable", message: "No response from Spotify" });
        return;
      }
    }

    console.error("Unexpected error exchanging token with Spotify", err);
    res.status(500).json({ error: "internal_server_error", message: "Failed exchanging token" });
  }
};

/** Runtime type guard for SpotifyTokenResponse */
function isSpotifyTokenResponse(obj: any): obj is SpotifyTokenResponse {
  return obj && typeof obj === "object" && "access_token" in obj;
}

/** POST /auth/refresh
 * Uses the refresh token cookie to obtain a new access token, updates cookies.
 */
export const refresh = async (req: Request, res: Response) => {
  const refreshTokenCookie = req.cookies?.spotify_refresh_token;
  if (!refreshTokenCookie) {
    return res.status(401).json({ error: "missing_refresh_token" });
  }

  try {
    const r = await refreshAccessToken({
      refreshToken: refreshTokenCookie,
      clientId: process.env.SPOTIFY_CLIENT_ID!,
    });

    if (r.status >= 400 || !isSpotifyTokenResponse(r.data) || !r.data.access_token) {
      console.error("Spotify refresh error", r.data);
      return res.status(r.status).json({
        error: "spotify_refresh_error",
        message: (r.data as SpotifyErrorResponse).error_description ?? "Unable to refresh token",
      });
    }

    const tokenData = r.data;

    res.cookie("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: tokenData.expires_in * 1000,
    });

    if (tokenData.refresh_token) {
      res.cookie("spotify_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
    }

    return res.status(204).send(); // no content; cookies updated
  } catch (err) {
    console.error("Error refreshing Spotify token", err);
    return res.status(500).json({ error: "internal_server_error" });
  }
};

export const refreshToken = refresh;
