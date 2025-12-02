import { Schema, model, type Document, type Model } from "mongoose";

export interface UserImage {
  url?: string;
  width?: number;
  height?: number;
}

export interface UserPreferences {
  defaultMoods: string[];
  brightnessRange: number[];
  energyRange: number[];
  tempoRange: number[];
}

export interface UserCapabilities {
  spotifyAudioFeatures: boolean;
  spotifyAudioAnalysis: boolean;
  previewUrlAvailable: boolean;
}

export interface UserDoc extends Document {
  spotifyUserId: string;
  displayName?: string;
  email?: string;
  country?: string;
  product?: string;
  images?: UserImage[];
  preferences: UserPreferences;
  capabilities: UserCapabilities;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<UserImage>(
  {
    url: String,
    width: Number,
    height: Number,
  },
  { _id: false },
);

const preferencesSchema = new Schema<UserPreferences>(
  {
    defaultMoods: [String],
    brightnessRange: [Number],
    energyRange: [Number],
    tempoRange: [Number],
  },
  { _id: false },
);

const capabilitiesSchema = new Schema<UserCapabilities>(
  {
    spotifyAudioFeatures: { type: Boolean, default: false },
    spotifyAudioAnalysis: { type: Boolean, default: false },
    previewUrlAvailable: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new Schema<UserDoc>(
  {
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
        tempoRange: [60, 200],
      }),
    },
    capabilities: {
      type: capabilitiesSchema,
      default: () => ({
        spotifyAudioFeatures: true,
        spotifyAudioAnalysis: false,
        previewUrlAvailable: false,
      }),
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<UserDoc> = model<UserDoc>("User", userSchema);

export default User;
