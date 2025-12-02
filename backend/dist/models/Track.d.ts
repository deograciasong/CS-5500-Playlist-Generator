import { type Document, type Model } from "mongoose";
export interface Artist {
    id?: string;
    name?: string;
}
export interface Image {
    url?: string;
    width?: number;
    height?: number;
}
export interface Album {
    id?: string;
    name?: string;
    images?: Image[];
}
export interface AudioFeatures {
    source?: "spotify" | "custom";
    tempo?: number;
    energy?: number;
    valence?: number;
    brightness?: number;
    acousticness?: number;
    instrumentalness?: number;
    danceability?: number;
    key?: number;
    mode?: number;
    timeSignature?: number;
    confidence?: number;
}
export interface AnalysisMeta {
    previewAvailable?: boolean;
    previewUrl?: string;
    pipelineVersion?: string;
    status?: "pending" | "completed" | "failed";
    error?: string;
    analyzedAt?: Date;
}
export interface TrackDoc extends Document {
    spotifyTrackId: string;
    name: string;
    artists: Artist[];
    album?: Album;
    durationMs?: number;
    explicit?: boolean;
    popularity?: number;
    audioFeatures?: AudioFeatures;
    featureVector?: number[];
    fetchedAt: Date;
    source: "spotify" | "user_upload";
    analysis?: AnalysisMeta;
}
declare const Track: Model<TrackDoc>;
export default Track;
//# sourceMappingURL=Track.d.ts.map