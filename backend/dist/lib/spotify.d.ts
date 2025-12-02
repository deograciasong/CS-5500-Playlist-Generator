/** Spotify OAuth2 Helper Functions and Types */
import type { SpotifyTokenResponse, SpotifyErrorResponse } from "../types/spotify.js";
export declare const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export declare const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export interface AuthorizeUrlParams {
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
    codeChallenge: string;
    codeChallengeMethod?: "S256" | "plain";
    showDialog?: boolean;
}
export declare function buildAuthorizeUrl({ clientId, redirectUri, scope, state, codeChallenge, codeChallengeMethod, showDialog, }: AuthorizeUrlParams): string;
export declare function isSpotifyTokenResponse(value: unknown): value is SpotifyTokenResponse;
export declare function isSpotifyErrorResponse(value: unknown): value is SpotifyErrorResponse;
export declare function getRetryAfterSeconds(headers: Record<string, unknown>): number | undefined;
//# sourceMappingURL=spotify.d.ts.map