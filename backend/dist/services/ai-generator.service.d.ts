export declare function generatePlaylistFromSpotify(opts: {
    spotifyAccessToken: string;
    length?: number;
    mood?: string;
}): Promise<{
    name: string;
    description: string;
    tracks: any[];
}>;
export declare function savePlaylistToSpotify(_opts: {
    spotifyAccessToken: string;
    userId: string;
    name: string;
    description?: string;
    trackSpotifyIds: string[];
}): Promise<void>;
declare const _default: {
    generatePlaylistFromSpotify: typeof generatePlaylistFromSpotify;
    savePlaylistToSpotify: typeof savePlaylistToSpotify;
};
export default _default;
//# sourceMappingURL=ai-generator.service.d.ts.map