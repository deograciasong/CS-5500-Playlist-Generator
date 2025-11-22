export interface SpotifyTokenResponse {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    refresh_token?: string;
    scope?: string;
}

export interface SpotifyErrorResponse {
    error: string;
    error_description: string;
}

export interface SpotifyExternalUrls {
    spotify?: string;
    [key: string]: string | undefined;
}

export interface SpotifyFollowers {
    href: string | null;
    total: number | null;
}

export interface SpotifyImage {
    url: string;
    height: number | null;
    width: number | null;
}

export interface SpotifyUserProfile {
    id: string;
    display_name?: string | null;
    email?: string;
    country?: string;
    product?: string;
    href: string;
    uri: string;
    type: "user";
    images?: SpotifyImage[];
    followers?: SpotifyFollowers;
    external_urls?: SpotifyExternalUrls;
}

export interface SpotifySimplifiedUser {
    id?: string;
    display_name?: string | null;
    href: string;
    uri: string;
    type: "user";
    external_urls?: SpotifyExternalUrls;
}

export interface SpotifyPaging<T> {
    href: string;
    items: T[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
}

export interface SpotifyTrackReference {
    uri: string;
}

export interface SpotifyPlaylistTracksRef {
    href: string;
    total: number;
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string | null;
    public: boolean | null;
    collaborative: boolean;
    snapshot_id: string;
    href: string;
    uri: string;
    type: "playlist";
    images?: SpotifyImage[];
    owner: SpotifySimplifiedUser;
    tracks: SpotifyPlaylistTracksRef;
    followers?: SpotifyFollowers;
    external_urls?: SpotifyExternalUrls;
}

export interface SpotifyCreatePlaylistRequest {
    name: string;
    description?: string;
    public?: boolean;
    collaborative?: boolean;
}

export interface SpotifyAddItemsRequest {
    uris: string[];
    position?: number;
}

export interface SpotifyReplaceItemsRequest {
    uris: string[];
}

export interface SpotifyReorderItemsRequest {
    range_start: number;
    range_length?: number;
    insert_before: number;
    snapshot_id?: string;
}

export interface SpotifySnapshotResponse {
    snapshot_id: string;
}
