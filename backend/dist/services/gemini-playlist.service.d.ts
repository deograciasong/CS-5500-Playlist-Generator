export declare function logGeminiDebug(data: any): void;
export declare function estimateAudioFeaturesWithGemini(tracks: any, existingMap: any): Promise<void>;
export declare function rankTracksWithGemini(vibeText: any, tracks: any, desired: any): Promise<{
    ids: any[];
    features: {};
}>;
export declare function generatePlaylistMetaWithGemini(vibeText: any, songs: any): Promise<{
    title: any;
    description: any;
    emoji: any;
}>;
//# sourceMappingURL=gemini-playlist.service.d.ts.map