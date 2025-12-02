import { SpotifyApiClient } from "../lib/spotify-api.js";
import type { SpotifyPaging, SpotifyPlaylist, SpotifyUserProfile } from "../types/spotify.js";
export interface ListUserPlaylistsOptions {
    limit?: number;
    offset?: number;
}
export declare function fetchCurrentUserProfile(api: SpotifyApiClient): Promise<SpotifyUserProfile>;
export declare function fetchCurrentUserPlaylists(api: SpotifyApiClient, options?: ListUserPlaylistsOptions): Promise<SpotifyPaging<SpotifyPlaylist>>;
//# sourceMappingURL=spotify-user.service.d.ts.map