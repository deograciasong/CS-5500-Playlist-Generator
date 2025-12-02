import { type Document, type Model, type Types } from "mongoose";
export interface PlaylistTrack {
    trackId: Types.ObjectId;
    position: number;
}
export interface PlaylistDoc extends Document {
    userId: Types.ObjectId;
    spotifyPlaylistId?: string;
    name: string;
    description?: string;
    tracks: PlaylistTrack[];
    snapshotId?: string;
    sourceSessionId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const Playlist: Model<PlaylistDoc>;
export default Playlist;
//# sourceMappingURL=Playlist.d.ts.map