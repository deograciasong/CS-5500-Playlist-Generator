/**
 * Spotify Token Manager
 *
 * Handles retrieval, refreshing, and persistence of Spotify access tokens.
 */
import type { Request, Response } from "express";
import { type SpotifyTokenManager } from "../../lib/spotify-api.js";
/** Creates a Spotify token manager for handling access tokens.
 *
 * getAccessToken: retrieves the current access token.
 * refreshAccessToken: uses the refresh token to get a new access token.
 * persistToken: updates cookies with the new token information.
 */
export declare function createSpotifyTokenManager(req: Request, res: Response): SpotifyTokenManager;
//# sourceMappingURL=spotify-token-manager.d.ts.map