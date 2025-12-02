import { Schema, model, type Document, type Model, type Types } from "mongoose";

export type FeedbackEventType =
  | "play"
  | "pause"
  | "skip"
  | "like"
  | "dislike"
  | "add_to_playlist"
  | "remove_from_playlist";

export interface FeedbackEventDoc extends Document {
  userId: Types.ObjectId;
  trackId: Types.ObjectId;
  playlistId?: Types.ObjectId;
  event: FeedbackEventType;
  position?: number;
  elapsedMs?: number;
  contextJson?: string;
  createdAt: Date;
}

const feedbackEventSchema = new Schema<FeedbackEventDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    playlistId: { type: Schema.Types.ObjectId, ref: "Playlist" },
    event: {
      type: String,
      required: true,
      enum: ["play", "pause", "skip", "like", "dislike", "add_to_playlist", "remove_from_playlist"],
    },
    position: Number,
    elapsedMs: Number,
    contextJson: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

feedbackEventSchema.index({ userId: 1, createdAt: -1 });
feedbackEventSchema.index({ trackId: 1, event: 1 });
feedbackEventSchema.index({ playlistId: 1, createdAt: -1 });

const FeedbackEvent: Model<FeedbackEventDoc> = model<FeedbackEventDoc>(
  "FeedbackEvent",
  feedbackEventSchema,
);

export default FeedbackEvent;
