import mongoose from "mongoose";

// Embedded schemas
const imageSchema = new mongoose.Schema({
  url: String,
  width: Number,
  height: Number
}, { _id: false });

const preferencesSchema = new mongoose.Schema({
  defaultMoods: [String],
  brightnessRange: [Number],
  energyRange: [Number],
  tempoRange: [Number]
}, { _id: false });

const capabilitiesSchema = new mongoose.Schema({
  spotifyAudioFeatures: { type: Boolean, default: false },
  spotifyAudioAnalysis: { type: Boolean, default: false },
  previewUrlAvailable: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  spotifyUserId: { type: String, required: true, unique: true },
  displayName: String,
  email: String,
  country: String,
  product: String,
  images: [imageSchema],
  preferences: {
    type: preferencesSchema,
    default: () => ({
      defaultMoods: [],
      brightnessRange: [0.0, 1.0],
      energyRange: [0.0, 1.0],
      tempoRange: [60, 200]
    })
  },
  capabilities: {
    type: capabilitiesSchema,
    default: () => ({
      spotifyAudioFeatures: true,
      spotifyAudioAnalysis: false,
      previewUrlAvailable: false
    })
  }
}, {
  timestamps: true
});

export default mongoose.model("User", userSchema);