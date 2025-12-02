import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface ParsedMoodQuery {
  tempoRange?: number[];
  energyRange?: number[];
  brightnessRange?: number[];
  instrumentalOnly?: boolean;
  durationMsMax?: number;
}

export interface MoodQueryDoc extends Document {
  userId: Types.ObjectId;
  rawText: string;
  parsed?: ParsedMoodQuery;
  modelVersion?: string;
  createdAt: Date;
}

const parsedSchema = new Schema<ParsedMoodQuery>(
  {
    tempoRange: [Number],
    energyRange: [Number],
    brightnessRange: [Number],
    instrumentalOnly: { type: Boolean, default: false },
    durationMsMax: Number,
  },
  { _id: false },
);

const moodQuerySchema = new Schema<MoodQueryDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rawText: { type: String, required: true },
    parsed: parsedSchema,
    modelVersion: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

moodQuerySchema.index({ userId: 1, createdAt: -1 });

const MoodQuery: Model<MoodQueryDoc> = model<MoodQueryDoc>("MoodQuery", moodQuerySchema);

export default MoodQuery;
