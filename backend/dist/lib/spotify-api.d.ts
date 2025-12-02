/** Spotify API Client */
import type { AxiosRequestConfig } from "axios";
import type { SpotifyErrorResponse, SpotifyTokenResponse } from "../types/spotify.js";
export interface SpotifyTokenManager {
    getAccessToken(): string | Promise<string>;
    refreshAccessToken?: () => Promise<SpotifyTokenResponse>;
    persistToken?: (token: SpotifyTokenResponse) => void | Promise<void>;
}
export interface SpotifyApiClientOptions extends AxiosRequestConfig {
    tokenManager: SpotifyTokenManager;
}
export declare class SpotifyApiError extends Error {
    readonly status: number;
    readonly payload?: SpotifyErrorResponse | unknown;
    constructor(message: string, status: number, payload?: unknown);
}
export declare class SpotifyApiClient {
    private readonly client;
    private readonly tokenManager;
    constructor({ tokenManager, ...axiosConfig }: SpotifyApiClientOptions);
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    private request;
    private handleUnauthorized;
    private toApiError;
    private buildApiError;
}
export declare function createSpotifyApiClient(tokenManager: SpotifyTokenManager, config?: AxiosRequestConfig): SpotifyApiClient;
//# sourceMappingURL=spotify-api.d.ts.map