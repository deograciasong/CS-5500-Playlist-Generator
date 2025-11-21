import mongoose from "mongoose";

const parsedSchema = new mongoose.Schema({
  tempoRange: [Number],
  energyRange: [Number],
  brightnessRange: [Number],
  instrumentalOnly: { type: Boolean, default: false },
  durationMsMax: Number
}, { _id: false });

const moodQuerySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rawText: { type: String, required: true },
  parsed: parsedSchema,
  modelVersion: String
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Index for efficient lookups
moodQuerySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("MoodQuery", moodQuerySchema);
