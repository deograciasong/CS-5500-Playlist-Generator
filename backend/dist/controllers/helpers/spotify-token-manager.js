/**
 * Spotify Token Manager
 *
 * Handles retrieval, refreshing, and persistence of Spotify access tokens.
 */
import { SpotifyApiError, } from "../../lib/spotify-api.js";
import { setSpotifyAuthCookies } from "../../lib/auth.js";
import { isNonEmptyString } from "../../lib/validation.js";
import { isSpotifyTokenResponse } from "../../lib/spotify.js";
import { refreshToken as refreshSpotifyToken, } from "../../services/spotify-auth.service.js";
const clientId = process.env.SPOTIFY_CLIENT_ID;
function extractBearerToken(header) {
    if (!header)
        return undefined;
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() === "bearer" && isNonEmptyString(token)) {
        return token;
    }
    return undefined;
}
/** Creates a Spotify token manager for handling access tokens.
 *
 * getAccessToken: retrieves the current access token.
 * refreshAccessToken: uses the refresh token to get a new access token.
 * persistToken: updates cookies with the new token information.
 */
export function createSpotifyTokenManager(req, res) {
    const cookieAccessToken = req.cookies?.spotify_access_token;
    const cookieRefreshToken = req.cookies?.spotify_refresh_token;
    let currentAccessToken = (isNonEmptyString(cookieAccessToken) && cookieAccessToken)
        || extractBearerToken(req.headers.authorization);
    let currentRefreshToken = isNonEmptyString(cookieRefreshToken)
        ? cookieRefreshToken
        : undefined;
    return {
        async getAccessToken() {
            if (!currentAccessToken) {
                throw new SpotifyApiError("Missing Spotify access token", 401);
            }
            return currentAccessToken;
        },
        async refreshAccessToken() {
            if (!currentRefreshToken) {
                throw new SpotifyApiError("Missing Spotify refresh token", 401);
            }
            const response = await refreshSpotifyToken({
                refreshToken: currentRefreshToken,
                clientId,
            });
            if (response.status >= 400 ||
                !isSpotifyTokenResponse(response.data)) {
                const payload = response.data;
                throw new SpotifyApiError(payload?.error_description ?? "Unable to refresh Spotify token", response.status, payload);
            }
            const tokenData = response.data;
            currentAccessToken = tokenData.access_token;
            if (tokenData.refresh_token) {
                currentRefreshToken = tokenData.refresh_token;
            }
            return tokenData;
        },
        async persistToken(token) {
            currentAccessToken = token.access_token;
            if (token.refresh_token) {
                currentRefreshToken = token.refresh_token;
            }
            setSpotifyAuthCookies(res, {
                accessToken: token.access_token,
                expiresIn: token.expires_in,
                ...(currentRefreshToken ? { refreshToken: currentRefreshToken } : {}),
            });
        },
    };
}
//# sourceMappingURL=spotify-token-manager.js.map