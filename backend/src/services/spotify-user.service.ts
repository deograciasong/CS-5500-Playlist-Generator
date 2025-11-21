import { SpotifyApiClient } from "../lib/spotify-api.js";
import type {
  SpotifyPaging,
  SpotifyPlaylist,
  SpotifyUserProfile,
} from "../types/spotify.js";

export interface ListUserPlaylistsOptions {
  limit?: number;
  offset?: number;
}

export async function fetchCurrentUserProfile(
  api: SpotifyApiClient,
): Promise<SpotifyUserProfile> {
  return api.get<SpotifyUserProfile>("/me");
}

export async function fetchCurrentUserPlaylists(
  api: SpotifyApiClient,
  options: ListUserPlaylistsOptions = {},
): Promise<SpotifyPaging<SpotifyPlaylist>> {
  const params: Record<string, number> = {};
  if (typeof options.limit === "number") {
    params.limit = options.limit;
  }
  if (typeof options.offset === "number") {
    params.offset = options.offset;
  }

  return api.get<SpotifyPaging<SpotifyPlaylist>>("/me/playlists", {
    params,
  });
}
