/** Spotify API Client */
import axios from "axios";
import { createHttpClient } from "./http.js";
import { isSpotifyErrorResponse, isSpotifyTokenResponse, } from "./spotify.js";
export class SpotifyApiError extends Error {
    status;
    payload;
    constructor(message, status, payload) {
        super(message);
        this.name = "SpotifyApiError";
        this.status = status;
        this.payload = payload;
    }
}
const DEFAULT_BASE_URL = "https://api.spotify.com/v1";
export class SpotifyApiClient {
    client;
    tokenManager;
    constructor({ tokenManager, ...axiosConfig }) {
        this.tokenManager = tokenManager;
        this.client = createHttpClient({
            baseURL: DEFAULT_BASE_URL,
            ...axiosConfig,
        });
    }
    async get(url, config) {
        const response = await this.request({ ...config, method: "GET", url });
        return response.data;
    }
    async post(url, data, config) {
        const response = await this.request({
            ...config,
            method: "POST",
            url,
            data,
        });
        return response.data;
    }
    async put(url, data, config) {
        const response = await this.request({
            ...config,
            method: "PUT",
            url,
            data,
        });
        return response.data;
    }
    async delete(url, config) {
        const response = await this.request({
            ...config,
            method: "DELETE",
            url,
        });
        return response.data;
    }
    async request(config, attempt = 0) {
        const accessToken = await this.tokenManager.getAccessToken();
        try {
            const masked = accessToken ? `${String(accessToken).slice(0, 6)}...${String(accessToken).slice(-6)}` : null;
            console.log('SpotifyApiClient.request - sending Authorization Bearer token present:', Boolean(accessToken), 'masked:', masked, 'attempt:', attempt);
        }
        catch (e) { }
        let response;
        try {
            response = await this.client.request({
                ...config,
                headers: {
                    ...(config.headers ?? {}),
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        }
        catch (error) {
            throw this.toApiError(error);
        }
        // If unauthorized or forbidden, attempt a single refresh+retry when a
        // refresh function is available. Some Spotify responses return 403 for
        // invalid/expired tokens in practice; include 403 here to recover where
        // appropriate.
        if ((response.status === 401 || response.status === 403) && attempt === 0 && this.tokenManager.refreshAccessToken) {
            return this.handleUnauthorized(config);
        }
        if (response.status >= 400) {
            throw this.buildApiError(response);
        }
        return response;
    }
    async handleUnauthorized(config) {
        if (!this.tokenManager.refreshAccessToken) {
            throw new SpotifyApiError("Unauthorized", 401);
        }
        const refreshed = await this.tokenManager.refreshAccessToken();
        if (!isSpotifyTokenResponse(refreshed)) {
            throw new SpotifyApiError("Failed to refresh Spotify access token", 401, refreshed);
        }
        if (this.tokenManager.persistToken) {
            await this.tokenManager.persistToken(refreshed);
        }
        return this.request(config, 1);
    }
    toApiError(error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                return this.buildApiError(error.response);
            }
            const message = error.message ?? "Spotify API request failed";
            return new SpotifyApiError(message, 500, error.toJSON?.() ?? error);
        }
        return new SpotifyApiError("Spotify API request failed", 500, error);
    }
    buildApiError(response) {
        const data = response.data;
        if (isSpotifyErrorResponse(data)) {
            return new SpotifyApiError(data.error_description ?? data.error ?? "Spotify API error", response.status, data);
        }
        return new SpotifyApiError("Spotify API error", response.status, data);
    }
}
export function createSpotifyApiClient(tokenManager, config = {}) {
    return new SpotifyApiClient({ tokenManager, ...config });
}
//# sourceMappingURL=spotify-api.js.map