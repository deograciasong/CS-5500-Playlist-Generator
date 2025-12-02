import { Schema, model } from "mongoose";
const plTrackSchema = new Schema({
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    position: { type: Number, required: true },
}, { _id: false });
const playlistSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    spotifyPlaylistId: String,
    name: { type: String, required: true },
    description: String,
    tracks: [plTrackSchema],
    snapshotId: String,
    sourceSessionId: { type: Schema.Types.ObjectId, ref: "GenerationSession" },
}, {
    timestamps: true,
});
playlistSchema.index({ userId: 1, updatedAt: -1 });
playlistSchema.index({ spotifyPlaylistId: 1 });
const Playlist = model("Playlist", playlistSchema);
export default Playlist;
//# sourceMappingURL=Playlist.js.map