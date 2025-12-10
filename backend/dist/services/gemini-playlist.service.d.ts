export declare function logGeminiDebug(data: any): void;
export type GeminiRankResult = {
    ids: string[];
    features: Record<string, any>;
};
export declare function estimateAudioFeaturesWithGemini(tracks: any[], existingMap: Record<string, any>): Promise<void>;
export declare function rankTracksWithGemini(vibeText: string, tracks: any[], desired: number): Promise<GeminiRankResult>;
export declare function generatePlaylistMetaWithGemini(vibeText: string, songs: any[]): Promise<{
    title: any;
    description: any;
    emoji: any;
}>;
//# sourceMappingURL=gemini-playlist.service.d.ts.map