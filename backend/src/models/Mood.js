import mongoose from "mongoose";

const moodDefaultsSchema = new mongoose.Schema({
  energyRange: [Number],
  brightnessRange: [Number],
  tempoRange: [Number]
}, { _id: false });

const moodSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  defaults: moodDefaultsSchema,
  icon: String,
  order: { type: Number, default: 0 }
});

// Index for efficient lookups
moodSchema.index({ order: 1 });
moodSchema.index({ key: 1 }, { unique: true });

export default mongoose.model("Mood", moodSchema);
