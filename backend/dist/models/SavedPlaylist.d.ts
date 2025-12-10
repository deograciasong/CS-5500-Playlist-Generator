import { type Document, type Model, type Types } from "mongoose";
export interface SavedSong {
    track_id: string;
    artists?: string;
    album_name?: string;
    track_name?: string;
    popularity?: number;
    duration_ms?: number;
    explicit?: boolean;
    danceability?: number;
    energy?: number;
    key?: number;
    loudness?: number;
    mode?: number;
    speechiness?: number;
    acousticness?: number;
    instrumentalness?: number;
    liveness?: number;
    valence?: number;
    tempo?: number;
    time_signature?: number;
    track_genre?: string;
}
export interface SavedPlaylistDoc extends Document {
    userId: Types.ObjectId;
    playlist: {
        mood: string;
        description: string;
        songs: SavedSong[];
        isGemini?: boolean;
        generator?: string;
        source?: string;
    };
    coverEmoji: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const SavedPlaylist: Model<SavedPlaylistDoc>;
export default SavedPlaylist;
//# sourceMappingURL=SavedPlaylist.d.ts.map