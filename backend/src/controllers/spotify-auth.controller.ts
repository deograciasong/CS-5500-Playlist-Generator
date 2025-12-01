/**
 * Spotify Auth Controller
 * ------------------------------------
 * - GET  /auth/login     → builds /authorize URL (with PKCE) and redirects
 * - GET  /auth/callback  → exchanges code+verifier, stores tokens in httpOnly cookies, redirects app
 * - POST /auth/refresh   → uses refresh token cookie to get new access token, updates cookies
 */

import "../config/env.js";
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
import jwt from "jsonwebtoken";
import LocalUser from "../models/LocalUser.js";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";

const AUTH_URL = "https://accounts.spotify.com/authorize";
const clientId = process.env.SPOTIFY_CLIENT_ID!;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
const appRedirect = process.env.APP_REDIRECT_AFTER_LOGIN ?? "/";
// Include `user-library-read` so the app can read the user's saved tracks
// (required by the AI generator). Keep playlist modify scopes for saving.
const scope =
  "user-read-email user-read-private user-library-read playlist-modify-public playlist-modify-private";

const cookieSecure = process.env.COOKIE_SECURE !== "false";

/** Cookie presets: toggles secure based on env (secure required for cross-site). */
const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: cookieSecure ? "none" : "lax",
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
  const codeVerifier = req.query.code_verifier as string | undefined;
  if (!codeChallenge) {
    res.status(400).json({ error: "missing_code_challenge" });
    return;
  }

  const rawState = randomState(20);
  const reqRedirect = typeof req.query.redirect === 'string' ? req.query.redirect : undefined;
  const state = reqRedirect ? `${rawState}|${encodeURIComponent(reqRedirect)}` : rawState;
  res.cookie("spotify_auth_state", state, {
    ...baseCookie,
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  if (codeVerifier) {
    res.cookie("spotify_code_verifier", codeVerifier, {
      ...baseCookie,
      maxAge: 10 * 60 * 1000,
    });
  }

  

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
    (req.body?.code_verifier as string | undefined) ??
    (req.cookies?.spotify_code_verifier as string | undefined);

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
  res.clearCookie("spotify_code_verifier", baseCookie);

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

    // Fetch Spotify profile so we can link or create a LocalUser
    try {
      const profileRes = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const profile = profileRes.data as any;
      const spotifyId = profile?.id;

      // Attempt to link to an authenticated local user (if present)
      const authToken = req.cookies?.auth_token || (req.headers.authorization || "").split(" ")[1];

      if (authToken) {
        try {
          const payload: any = (jwt as any).verify(authToken, JWT_SECRET) as any;
          const currentUserId = payload?.sub;
          if (currentUserId) {
            // Ensure this spotify account isn't already linked to another local user
            const already = await LocalUser.findOne({ spotifyId }).exec();
            if (already && String(already._id) !== String(currentUserId)) {
              // conflict: spotify account linked elsewhere
              return res.status(409).json({ error: "spotify_already_linked", message: "This Spotify account is already linked to another user" });
            }

            const user = await LocalUser.findById(currentUserId).exec();
            if (user) {
              (user as any).spotifyId = spotifyId;
              (user as any).spotifyProfile = profile;
              (user as any).spotifyLinked = true;
              try {
                await user.save();
                console.log(`Saved local user ${user._id} after linking Spotify ${spotifyId}`);
                console.log('Post-save user fields', { id: String(user._id), spotifyId: (user as any).spotifyId, spotifyLinked: (user as any).spotifyLinked });
                try {
                  const reloaded = await LocalUser.findById(user._id).lean().exec();
                  console.log('DB read immediately after save', { reloaded });
                } catch (reErr) {
                  console.error('Failed to re-query user after save', { userId: user._id, err: reErr });
                }
              } catch (saveErr) {
                console.error('Failed to save linked local user', { userId: user._id, err: saveErr });
                return res.status(500).json({ error: 'db_save_failed', message: 'Failed to persist Spotify link' });
              }

              // Re-issue JWT for the local user
              const payloadOut = { sub: String(user._id), email: user.email, provider: "local" };
              const token = (jwt as any).sign(payloadOut, JWT_SECRET, { expiresIn: "7d" });
              res.cookie("auth_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
              });

              const redirectTarget = (state && state.includes('|'))
                ? decodeURIComponent(state.split('|').slice(1).join('|'))
                : (typeof req.query.redirect === "string" ? req.query.redirect : appRedirect);
              console.log(`Linked Spotify account ${spotifyId} to local user ${user._id}; redirecting to ${redirectTarget}`);
              try {
                const qs = `spotify_linked=1&spotify_id=${encodeURIComponent(spotifyId ?? '')}&spotify_name=${encodeURIComponent((profile?.display_name) ?? profile?.id ?? '')}`;
                const joiner = redirectTarget.includes('?') ? '&' : '?';
                return res.redirect(`${redirectTarget}${joiner}${qs}`);
              } catch (e) {
                return res.redirect(redirectTarget);
              }
            }
          }
        } catch (e) {
          // ignore token verification errors and fallthrough to unauthenticated flow
          console.debug("No local auth token or invalid token during spotify callback link flow");
        }
      }

      // No authenticated local user — sign-in or create a LocalUser linked to this Spotify account
      let targetUser = await LocalUser.findOne({ spotifyId }).exec();
      if (!targetUser) {
        // Try to find by email (if available) and link if that account is not already linked
        const email = profile?.email;
        if (email) {
          const byEmail = await LocalUser.findOne({ email }).exec();
            if (byEmail && !(byEmail as any).spotifyId) {
              (byEmail as any).spotifyId = spotifyId;
              (byEmail as any).spotifyProfile = profile;
              (byEmail as any).spotifyLinked = true;
              try {
                targetUser = await byEmail.save();
                console.log(`Linked Spotify ${spotifyId} to existing user ${targetUser._id} (by email)`);
                console.log('Post-save user fields', { id: String(targetUser._id), spotifyId: (targetUser as any).spotifyId, spotifyLinked: (targetUser as any).spotifyLinked });
                try {
                  const reloaded2 = await LocalUser.findById(targetUser._id).lean().exec();
                  console.log('DB read immediately after save (by email)', { reloaded: reloaded2 });
                } catch (reErr2) {
                  console.error('Failed to re-query user after save (by email)', { userId: targetUser._id, err: reErr2 });
                }
              } catch (saveErr) {
                console.error('Failed to save user when linking by email', { email: byEmail.email, err: saveErr });
                return res.status(500).json({ error: 'db_save_failed', message: 'Failed to persist Spotify link' });
              }
            }
        }
      }

      if (!targetUser) {
        // Create a new local user and link spotify account. Generate a random password.
        const randomPassword = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(randomPassword, salt);

        let newUser;
                try {
          newUser = await LocalUser.create({
            name: profile?.display_name || `Spotify User ${spotifyId}`,
            email: profile?.email || `spotify-${spotifyId}@local`,
            passwordHash: hash,
            spotifyId,
            spotifyProfile: profile,
            spotifyLinked: true,
          });
          console.log('Created new local user', { id: String(newUser._id), spotifyId: (newUser as any).spotifyId, spotifyLinked: (newUser as any).spotifyLinked });
          try {
            const reloaded3 = await LocalUser.findById(newUser._id).lean().exec();
            console.log('DB read immediately after create', { reloaded: reloaded3 });
          } catch (reErr3) {
            console.error('Failed to re-query user after create', { userId: newUser._id, err: reErr3 });
          }
        } catch (createErr) {
          console.error('Failed to create local user for Spotify account', { spotifyId, err: createErr });
          return res.status(500).json({ error: 'db_create_failed', message: 'Failed to create linked local user' });
        }
        targetUser = newUser;
      }

      // Issue JWT for the linked/created local user
      const payloadOut = { sub: String(targetUser._id), email: targetUser.email, provider: "local" };
      const token = (jwt as any).sign(payloadOut, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const redirectTarget = (state && state.includes('|'))
        ? decodeURIComponent(state.split('|').slice(1).join('|'))
        : (typeof req.query.redirect === "string" ? req.query.redirect : appRedirect);
      console.log(`Authenticated as local user ${targetUser._id}; redirecting to ${redirectTarget}`);
      try {
        const qs = `spotify_linked=1&spotify_id=${encodeURIComponent(spotifyId ?? '')}&spotify_name=${encodeURIComponent((profile?.display_name) ?? profile?.id ?? '')}`;
        const joiner = redirectTarget.includes('?') ? '&' : '?';
        return res.redirect(`${redirectTarget}${joiner}${qs}`);
      } catch (e) {
        return res.redirect(redirectTarget);
      }
    } catch (e: any) {
      console.error("Failed to fetch Spotify profile or link account", e?.response?.data ?? e);
      // Still redirect the user but surface an error in query if desired
      const redirectTarget = (state && state.includes('|'))
        ? decodeURIComponent(state.split('|').slice(1).join('|'))
        : (typeof req.query.redirect === "string" ? req.query.redirect : appRedirect);
      console.log(`Spotify callback failed to link; redirecting to ${redirectTarget}`);
      return res.redirect(redirectTarget);
    }
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
