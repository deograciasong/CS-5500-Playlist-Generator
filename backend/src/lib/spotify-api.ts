/** Spotify API Client */

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import axios from "axios";
import { createHttpClient } from "./http.js";
import {
  isSpotifyErrorResponse,
  isSpotifyTokenResponse,
} from "./spotify.js";
import type {
  SpotifyErrorResponse,
  SpotifyTokenResponse,
} from "../types/spotify.js";

export interface SpotifyTokenManager {
  getAccessToken(): string | Promise<string>;
  refreshAccessToken?: () => Promise<SpotifyTokenResponse>;
  persistToken?: (token: SpotifyTokenResponse) => void | Promise<void>;
}

export interface SpotifyApiClientOptions extends AxiosRequestConfig {
  tokenManager: SpotifyTokenManager;
}

export class SpotifyApiError extends Error {
  public readonly status: number;
  public readonly payload?: SpotifyErrorResponse | unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "SpotifyApiError";
    this.status = status;
    this.payload = payload;
  }
}

const DEFAULT_BASE_URL = "https://api.spotify.com/v1";

export class SpotifyApiClient {
  private readonly client: AxiosInstance;
  private readonly tokenManager: SpotifyTokenManager;

  constructor({ tokenManager, ...axiosConfig }: SpotifyApiClientOptions) {
    this.tokenManager = tokenManager;
    this.client = createHttpClient({
      baseURL: DEFAULT_BASE_URL,
      ...axiosConfig,
    });
  }

  public async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.request<T>({ ...config, method: "GET", url });
    return response.data;
  }

  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.request<T>({
      ...config,
      method: "POST",
      url,
      data,
    });
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.request<T>({
      ...config,
      method: "PUT",
      url,
      data,
    });
    return response.data;
  }

  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.request<T>({
      ...config,
      method: "DELETE",
      url,
    });
    return response.data;
  }

  private async request<T>(
    config: AxiosRequestConfig,
    attempt = 0,
  ): Promise<AxiosResponse<T>> {
    const accessToken = await this.tokenManager.getAccessToken();
    let response: AxiosResponse<T>;

    try {
      response = await this.client.request<T>({
        ...config,
        headers: {
          ...(config.headers ?? {}),
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      throw this.toApiError(error);
    }

    if (response.status === 401 && attempt === 0 && this.tokenManager.refreshAccessToken) {
      return this.handleUnauthorized<T>(config);
    }

    if (response.status >= 400) {
      throw this.buildApiError(response);
    }

    return response;
  }

  private async handleUnauthorized<T>(
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    if (!this.tokenManager.refreshAccessToken) {
      throw new SpotifyApiError("Unauthorized", 401);
    }

    const refreshed = await this.tokenManager.refreshAccessToken();
    if (!isSpotifyTokenResponse(refreshed)) {
      throw new SpotifyApiError(
        "Failed to refresh Spotify access token",
        401,
        refreshed,
      );
    }

    if (this.tokenManager.persistToken) {
      await this.tokenManager.persistToken(refreshed);
    }

    return this.request<T>(config, 1);
  }

  private toApiError(error: unknown): SpotifyApiError {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return this.buildApiError(error.response);
      }
      const message = error.message ?? "Spotify API request failed";
      return new SpotifyApiError(message, 500, error.toJSON?.() ?? error);
    }
    return new SpotifyApiError(
      "Spotify API request failed",
      500,
      error,
    );
  }

  private buildApiError(
    response: AxiosResponse<unknown>,
  ): SpotifyApiError {
    const data = response.data;
    if (isSpotifyErrorResponse(data)) {
      return new SpotifyApiError(
        data.error_description ?? data.error ?? "Spotify API error",
        response.status,
        data,
      );
    }

    return new SpotifyApiError(
      "Spotify API error",
      response.status,
      data,
    );
  }
}

export function createSpotifyApiClient(
  tokenManager: SpotifyTokenManager,
  config: AxiosRequestConfig = {},
): SpotifyApiClient {
  return new SpotifyApiClient({ tokenManager, ...config });
}
