import { SpotifyApiClient } from "../lib/spotify-api.js";
import type { SpotifyPlaylist, SpotifySnapshotResponse, SpotifyAddItemsRequest, SpotifyCreatePlaylistRequest, SpotifyReplaceItemsRequest, SpotifyReorderItemsRequest } from "../types/spotify.js";
export declare function createPlaylist(api: SpotifyApiClient, userId: string, payload: SpotifyCreatePlaylistRequest): Promise<SpotifyPlaylist>;
export declare function addItemsToPlaylist(api: SpotifyApiClient, playlistId: string, payload: SpotifyAddItemsRequest): Promise<SpotifySnapshotResponse>;
export declare function replacePlaylistItems(api: SpotifyApiClient, playlistId: string, payload: SpotifyReplaceItemsRequest): Promise<SpotifySnapshotResponse>;
export declare function reorderPlaylistItems(api: SpotifyApiClient, playlistId: string, payload: SpotifyReorderItemsRequest): Promise<SpotifySnapshotResponse>;
//# sourceMappingURL=spotify-playlist.service.d.ts.map