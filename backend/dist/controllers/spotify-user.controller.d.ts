/**
 * Spotify User Controller
 * -----------------------------
 * - GET /me              → getCurrentUserProfile
 * - GET /me/playlists    → getCurrentUserPlaylists
 */
import type { Request, Response } from "express";
/** Gets the current user's Spotify profile information. */
export declare const getCurrentUserProfile: (req: Request, res: Response) => Promise<void>;
/** Gets the current user's Spotify playlists. */
export declare const getCurrentUserPlaylists: (req: Request, res: Response) => Promise<void>;
/** Debug endpoint: returns cookies and Authorization header received by the server. */
export declare const debugSpotifyCookies: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=spotify-user.controller.d.ts.map