/**
 * Spotify Authentication Service
 *
 * Handles calls to Spotify's OAuth2 token endpoint with PKCE.
 */
import { AxiosResponse } from "axios";
import { SpotifyTokenResponse, SpotifyErrorResponse } from "../types/spotify.js";
/** Input parameters for exchanging an authorization code with PKCE. */
export interface ExchangeParams {
    code: string;
    redirectUri: string;
    clientId: string;
    codeVerifier: string;
}
/** Input parameters for refreshing an access token. */
export interface RefreshParams {
    refreshToken: string;
    clientId: string;
}
/** Exchanges an authorization code + code verifier for an access token. */
export declare function exchangeCodeForToken({ code, redirectUri, clientId, codeVerifier }: ExchangeParams): Promise<AxiosResponse<SpotifyTokenResponse | SpotifyErrorResponse>>;
/** Refreshes an access token using a long-lived refresh token. */
export declare function refreshToken({ refreshToken, clientId }: RefreshParams): Promise<AxiosResponse<SpotifyTokenResponse | SpotifyErrorResponse>>;
//# sourceMappingURL=spotify-auth.service.d.ts.map