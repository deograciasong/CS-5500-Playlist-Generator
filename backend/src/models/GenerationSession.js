import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
  score: Number,
  reasons: [String]
}, { _id: false });

const algorithmsSchema = new mongoose.Schema({
  filter: String,
  ranker: String,
  flow: String
}, { _id: false });

const generationSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moodQueryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MoodQuery', required: true },
  candidates: [candidateSchema],
  ordering: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
  algorithms: algorithmsSchema,
  durationMs: Number,
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  error: String
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Index for efficient lookups
generationSessionSchema.index({ userId: 1, createdAt: -1 });
generationSessionSchema.index({ moodQueryId: 1 });

export default mongoose.model("GenerationSession", generationSessionSchema);
