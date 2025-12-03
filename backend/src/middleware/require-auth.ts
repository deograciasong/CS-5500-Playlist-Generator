import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { secureCookieDefaults } from "../lib/auth.js";
import { createSpotifyApiClient } from "../lib/spotify-api.js";
import { createSpotifyTokenManager } from "../controllers/helpers/spotify-token-manager.js";
import { fetchCurrentUserProfile } from "../services/spotify-user.service.js";
import LocalUser from "../models/LocalUser.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";

export interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

function issueAuthCookie(res: Response, userId: string, email?: string) {
  const payload = { sub: userId, ...(email ? { email } : {}), provider: "local" };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("auth_token", token, {
    ...secureCookieDefaults,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const bearer = (req.headers.authorization || "").split(" ")[1];
  const token = req.cookies?.auth_token || bearer;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      const userId = payload?.sub;
      if (!userId) {
        res.status(401).json({ error: "invalid_token", message: "Invalid token payload" });
        return;
      }
      (req as AuthenticatedRequest).authUserId = String(userId);
      next();
      return;
    } catch (err) {
      // fall through to try Spotify tokens
    }
  }

  // Fallback: authenticate via Spotify access token cookies
  const spotifyAccess = req.cookies?.spotify_access_token;
  if (!spotifyAccess) {
    res.status(401).json({ error: "unauthenticated", message: "Login required" });
    return;
  }

  try {
    const api = createSpotifyApiClient(createSpotifyTokenManager(req, res));
    const profile = await fetchCurrentUserProfile(api);
    const spotifyId = (profile as any)?.id;
    if (!spotifyId) {
      res.status(401).json({ error: "unauthenticated", message: "Missing Spotify profile" });
      return;
    }

    const user = await LocalUser.findOne({ spotifyId }).exec();
    if (!user) {
      res.status(401).json({ error: "unauthenticated", message: "Account not linked; please log in again" });
      return;
    }

    const newToken = issueAuthCookie(res, String(user._id), user.email);
    (req as AuthenticatedRequest).authUserId = String(user._id);
    // Also honor Authorization header for this request
    req.headers.authorization = `Bearer ${newToken}`;
    next();
  } catch (err) {
    console.error("Spotify fallback auth failed", err);
    res.status(401).json({ error: "unauthenticated", message: "Login required" });
  }
};

export default requireAuth;
