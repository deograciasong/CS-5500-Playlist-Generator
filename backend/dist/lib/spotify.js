/** Spotify OAuth2 Helper Functions and Types */
export const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export function buildAuthorizeUrl({ clientId, redirectUri, scope, state, codeChallenge, codeChallengeMethod = "S256", showDialog, }) {
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
export function isSpotifyTokenResponse(value) {
    const token = value;
    return (!!token &&
        typeof token === "object" &&
        typeof token.access_token === "string" &&
        token.token_type === "Bearer" &&
        typeof token.expires_in === "number");
}
export function isSpotifyErrorResponse(value) {
    return (!!value &&
        typeof value === "object" &&
        typeof value.error === "string");
}
export function getRetryAfterSeconds(headers) {
    const retryAfter = headers["retry-after"] ??
        headers["Retry-After"] ??
        headers["RETRY-AFTER"];
    if (typeof retryAfter === "number")
        return retryAfter;
    if (typeof retryAfter === "string") {
        const parsed = Number(retryAfter);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return undefined;
}
//# sourceMappingURL=spotify.js.map