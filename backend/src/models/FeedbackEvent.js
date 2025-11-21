import mongoose from "mongoose";

const feedbackEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
  playlistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' },
  event: { 
    type: String, 
    required: true,
    enum: ['play', 'pause', 'skip', 'like', 'dislike', 'add_to_playlist', 'remove_from_playlist']
  },
  position: Number, // Position in playlist or track position in ms
  elapsedMs: Number, // How much of the track was played
  contextJson: String, // Additional context as JSON string
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Index for efficient lookups and analytics
feedbackEventSchema.index({ userId: 1, createdAt: -1 });
feedbackEventSchema.index({ trackId: 1, event: 1 });
feedbackEventSchema.index({ playlistId: 1, createdAt: -1 });

export default mongoose.model("FeedbackEvent", feedbackEventSchema);
