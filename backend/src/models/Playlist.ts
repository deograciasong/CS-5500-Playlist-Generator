import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface PlaylistTrack {
  trackId: Types.ObjectId;
  position: number;
}

export interface PlaylistDoc extends Document {
  userId: Types.ObjectId;
  spotifyPlaylistId?: string;
  name: string;
  description?: string;
  tracks: PlaylistTrack[];
  snapshotId?: string;
  sourceSessionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const plTrackSchema = new Schema<PlaylistTrack>(
  {
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    position: { type: Number, required: true },
  },
  { _id: false },
);

const playlistSchema = new Schema<PlaylistDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    spotifyPlaylistId: String,
    name: { type: String, required: true },
    description: String,
    tracks: [plTrackSchema],
    snapshotId: String,
    sourceSessionId: { type: Schema.Types.ObjectId, ref: "GenerationSession" },
  },
  {
    timestamps: true,
  },
);

playlistSchema.index({ userId: 1, updatedAt: -1 });
playlistSchema.index({ spotifyPlaylistId: 1 });

const Playlist: Model<PlaylistDoc> = model<PlaylistDoc>("Playlist", playlistSchema);

export default Playlist;
