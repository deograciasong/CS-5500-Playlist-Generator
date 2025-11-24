/** Spotify OAuth2 Helper Functions and Types */

import type { SpotifyTokenResponse, SpotifyErrorResponse } from "../types/spotify.js";

export const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

export interface AuthorizeUrlParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod?: "S256" | "plain";
  showDialog?: boolean;
}

export function buildAuthorizeUrl({
  clientId,
  redirectUri,
  scope,
  state,
  codeChallenge,
  codeChallengeMethod = "S256",
  showDialog,
}: AuthorizeUrlParams): string {
  const url = new URL(SPOTIFY_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scope);
  url.searchParams.set("code_challenge_method", codeChallengeMethod);
  url.searchParams.set("code_challenge", codeChallenge);

  if (typeof showDialog === "boolean") {
    url.searchParams.set("show_dialog", showDialog ? "true" : "false");
  }

  return url.toString();
}

export function isSpotifyTokenResponse(
  value: unknown,
): value is SpotifyTokenResponse {
  const token = value as Partial<SpotifyTokenResponse> | undefined;
  return (
    !!token &&
    typeof token === "object" &&
    typeof token.access_token === "string" &&
    token.token_type === "Bearer" &&
    typeof token.expires_in === "number"
  );
}

export function isSpotifyErrorResponse(
  value: unknown,
): value is SpotifyErrorResponse {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as SpotifyErrorResponse).error === "string"
  );
}

export function getRetryAfterSeconds(
  headers: Record<string, unknown>,
): number | undefined {
  const retryAfter =
    headers["retry-after"] ??
    headers["Retry-After"] ??
    headers["RETRY-AFTER"];

  if (typeof retryAfter === "number") return retryAfter;
  if (typeof retryAfter === "string") {
    const parsed = Number(retryAfter);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}
