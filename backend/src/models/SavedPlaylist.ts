import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface SavedSong {
  track_id: string;
  artists?: string;
  album_name?: string;
  track_name?: string;
  popularity?: number;
  duration_ms?: number;
  explicit?: boolean;
  danceability?: number;
  energy?: number;
  key?: number;
  loudness?: number;
  mode?: number;
  speechiness?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
  valence?: number;
  tempo?: number;
  time_signature?: number;
  track_genre?: string;
}

export interface SavedPlaylistDoc extends Document {
  userId: Types.ObjectId;
  playlist: {
    mood: string;
    description: string;
    songs: SavedSong[];
    isGemini?: boolean;
    generator?: string;
    source?: string;
  };
  coverEmoji: string;
  createdAt: Date;
  updatedAt: Date;
}

const savedSongSchema = new Schema<SavedSong>(
  {
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
  },
  { _id: false },
);

const savedPlaylistSchema = new Schema<SavedPlaylistDoc>(
  {
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
  },
  {
    timestamps: true,
  },
);

savedPlaylistSchema.index({ userId: 1, createdAt: -1 });

const SavedPlaylist: Model<SavedPlaylistDoc> = model<SavedPlaylistDoc>(
  "SavedPlaylist",
  savedPlaylistSchema,
);

export default SavedPlaylist;
