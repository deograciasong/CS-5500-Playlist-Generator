import { SpotifyApiClient } from "../lib/spotify-api.js";
import type {
  SpotifyPlaylist,
  SpotifySnapshotResponse,
  SpotifyAddItemsRequest,
  SpotifyCreatePlaylistRequest,
  SpotifyReplaceItemsRequest,
  SpotifyReorderItemsRequest,
} from "../types/spotify.js";

export async function createPlaylist(
  api: SpotifyApiClient,
  userId: string,
  payload: SpotifyCreatePlaylistRequest,
): Promise<SpotifyPlaylist> {
  return api.post<SpotifyPlaylist>(`/users/${userId}/playlists`, payload);
}

export async function addItemsToPlaylist(
  api: SpotifyApiClient,
  playlistId: string,
  payload: SpotifyAddItemsRequest,
): Promise<SpotifySnapshotResponse> {
  return api.post<SpotifySnapshotResponse>(
    `/playlists/${playlistId}/tracks`,
    payload,
  );
}

export async function replacePlaylistItems(
  api: SpotifyApiClient,
  playlistId: string,
  payload: SpotifyReplaceItemsRequest,
): Promise<SpotifySnapshotResponse> {
  return api.put<SpotifySnapshotResponse>(
    `/playlists/${playlistId}/tracks`,
    payload,
  );
}

export async function reorderPlaylistItems(
  api: SpotifyApiClient,
  playlistId: string,
  payload: SpotifyReorderItemsRequest,
): Promise<SpotifySnapshotResponse> {
  return api.put<SpotifySnapshotResponse>(
    `/playlists/${playlistId}/tracks`,
    payload,
  );
}
