/**
 * Spotify Authentication Service
 *
 * Handles calls to Spotify's OAuth2 token endpoint with PKCE.
 */
import axios from "axios";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const AXIOS_CONFIG = {
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    timeout: 10000,
    // Throw 5xx errors, keep 2xx-4xx responses
    validateStatus: (status) => {
        return status >= 200 && status < 500;
    }
};
/** Exchanges an authorization code + code verifier for an access token. */
export async function exchangeCodeForToken({ code, redirectUri, clientId, codeVerifier }) {
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier
    }).toString();
    return axios.post(TOKEN_URL, body, AXIOS_CONFIG);
}
/** Refreshes an access token using a long-lived refresh token. */
export async function refreshToken({ refreshToken, clientId }) {
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId
    }).toString();
    return axios.post(TOKEN_URL, body, AXIOS_CONFIG);
}
//# sourceMappingURL=spotify-auth.service.js.map