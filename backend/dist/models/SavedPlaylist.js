import { Schema, model } from "mongoose";
const savedSongSchema = new Schema({
    track_id: { type: String, required: true },
    artists: String,
    album_name: String,
    track_name: String,
    popularity: Number,
    duration_ms: Number,
    explicit: Boolean,
    danceability: Number,
    energy: Number,
    key: Number,
    loudness: Number,
    mode: Number,
    speechiness: Number,
    acousticness: Number,
    instrumentalness: Number,
    liveness: Number,
    valence: Number,
    tempo: Number,
    time_signature: Number,
    track_genre: String,
}, { _id: false });
const savedPlaylistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "LocalUser",
        required: true,
    },
    playlist: {
        mood: { type: String, required: true },
        description: { type: String, default: "" },
        songs: { type: [savedSongSchema], default: [] },
        isGemini: { type: Boolean, default: false },
        generator: { type: String, default: "" },
        source: { type: String, default: "" },
    },
    coverEmoji: { type: String, default: "🎵" },
}, {
    timestamps: true,
});
savedPlaylistSchema.index({ userId: 1, createdAt: -1 });
const SavedPlaylist = model("SavedPlaylist", savedPlaylistSchema);
export default SavedPlaylist;
//# sourceMappingURL=SavedPlaylist.js.map