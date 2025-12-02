import { Schema, model, type Document, type Model } from "mongoose";

export interface Artist {
  id?: string;
  name?: string;
}

export interface Image {
  url?: string;
  width?: number;
  height?: number;
}

export interface Album {
  id?: string;
  name?: string;
  images?: Image[];
}

export interface AudioFeatures {
  source?: "spotify" | "custom";
  tempo?: number;
  energy?: number;
  valence?: number;
  brightness?: number;
  acousticness?: number;
  instrumentalness?: number;
  danceability?: number;
  key?: number;
  mode?: number;
  timeSignature?: number;
  confidence?: number;
}

export interface AnalysisMeta {
  previewAvailable?: boolean;
  previewUrl?: string;
  pipelineVersion?: string;
  status?: "pending" | "completed" | "failed";
  error?: string;
  analyzedAt?: Date;
}

export interface TrackDoc extends Document {
  spotifyTrackId: string;
  name: string;
  artists: Artist[];
  album?: Album;
  durationMs?: number;
  explicit?: boolean;
  popularity?: number;
  audioFeatures?: AudioFeatures;
  featureVector?: number[];
  fetchedAt: Date;
  source: "spotify" | "user_upload";
  analysis?: AnalysisMeta;
}

const artistSchema = new Schema<Artist>(
  {
    id: String,
    name: String,
  },
  { _id: false },
);

const imageSchema = new Schema<Image>(
  {
    url: String,
    width: Number,
    height: Number,
  },
  { _id: false },
);

const albumSchema = new Schema<Album>(
  {
    id: String,
    name: String,
    images: [imageSchema],
  },
  { _id: false },
);

const audioFeaturesSchema = new Schema<AudioFeatures>(
  {
    source: { type: String, enum: ["spotify", "custom"], default: "spotify" },
    tempo: Number,
    energy: Number,
    valence: Number,
    brightness: Number,
    acousticness: Number,
    instrumentalness: Number,
    danceability: Number,
    key: Number,
    mode: Number,
    timeSignature: Number,
    confidence: Number,
  },
  { _id: false },
);

const analysisMetaSchema = new Schema<AnalysisMeta>(
  {
    previewAvailable: Boolean,
    previewUrl: String,
    pipelineVersion: String,
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    error: String,
    analyzedAt: Date,
  },
  { _id: false },
);

const trackSchema = new Schema<TrackDoc>({
  spotifyTrackId: { type: String, required: true },
  name: { type: String, required: true },
  artists: [artistSchema],
  album: albumSchema,
  durationMs: Number,
  explicit: Boolean,
  popularity: Number,
  audioFeatures: audioFeaturesSchema,
  featureVector: [Number],
  fetchedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ["spotify", "user_upload"], default: "spotify" },
  analysis: analysisMetaSchema,
});

trackSchema.index({ spotifyTrackId: 1 }, { unique: true });
trackSchema.index({ "artists.name": 1 });
trackSchema.index({ "album.name": 1 });

const Track: Model<TrackDoc> = model<TrackDoc>("Track", trackSchema);

export default Track;
