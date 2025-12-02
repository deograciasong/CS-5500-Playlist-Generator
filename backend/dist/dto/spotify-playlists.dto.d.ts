/** Data Transfer Object for creating a new playlist. */
export interface CreatePlaylistDto {
    userId: string;
    name: string;
    description?: string;
    public?: boolean;
    collaborative?: boolean;
}
export interface AddTracksDto {
    uris: string[];
    position?: number;
}
export interface ReplaceTracksDto {
    uris: string[];
}
export interface ReorderTracksDto {
    rangeStart: number;
    insertBefore: number;
    rangeLength?: number;
    snapshotId?: string;
}
//# sourceMappingURL=spotify-playlists.dto.d.ts.map