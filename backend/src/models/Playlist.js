import mongoose from "mongoose";

const plTrackSchema = new mongoose.Schema({
  trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
  position: { type: Number, required: true }
}, { _id: false });

const playlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  spotifyPlaylistId: String,
  name: { type: String, required: true },
  description: String,
  tracks: [plTrackSchema],
  snapshotId: String,
  sourceSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GenerationSession' }
}, {
  timestamps: true
});

// Index for efficient lookups
playlistSchema.index({ userId: 1, updatedAt: -1 });
playlistSchema.index({ spotifyPlaylistId: 1 });

export default mongoose.model("Playlist", playlistSchema);
