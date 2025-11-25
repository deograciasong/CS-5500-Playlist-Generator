/**
 * Spotify Auth Controller
 * ------------------------------------
 * - GET  /auth/login     → builds /authorize URL (with PKCE) and redirects
 * - GET  /auth/callback  → exchanges code+verifier, stores tokens in httpOnly cookies, redirects app
 * - POST /auth/refresh   → uses refresh token cookie to get new access token, updates cookies
 */
import type { Request, Response } from "express";
/**
 * GET /auth/login
 * Redirects the browser to Spotify's /authorize (PKCE).
 */
export declare const login: (req: Request, res: Response) => void;
/**
 * GET /auth/callback
 * Exchanges code+code_verifier for tokens, sets httpOnly cookies, and redirects to the app.
 */
export declare const callback: (req: Request, res: Response) => Promise<void>;
/** POST /auth/refresh
 * Uses the refresh token cookie to obtain a new access token, updates cookies.
 */
export declare const refresh: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const refreshToken: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=spotify-auth.controller.d.ts.map