import mongoose from "mongoose";

const userLibrarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
  savedAt: { type: Date, default: Date.now },
  removedAt: Date,
  like: { type: Boolean, default: true },
  skipCount: { type: Number, default: 0 },
  lastHeardAt: Date
});

// Compound index for efficient queries
userLibrarySchema.index({ userId: 1, trackId: 1 }, { unique: true });
userLibrarySchema.index({ userId: 1, savedAt: -1 });

export default mongoose.model("UserLibrary", userLibrarySchema);
