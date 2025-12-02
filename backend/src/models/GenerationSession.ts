import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface Candidate {
  trackId: Types.ObjectId;
  score?: number;
  reasons?: string[];
}

export interface AlgorithmsMeta {
  filter?: string;
  ranker?: string;
  flow?: string;
}

export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface GenerationSessionDoc extends Document {
  userId: Types.ObjectId;
  moodQueryId: Types.ObjectId;
  candidates: Candidate[];
  ordering: Types.ObjectId[];
  algorithms?: AlgorithmsMeta;
  durationMs?: number;
  status: GenerationStatus;
  error?: string;
  createdAt: Date;
}

const candidateSchema = new Schema<Candidate>(
  {
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    score: Number,
    reasons: [String],
  },
  { _id: false },
);

const algorithmsSchema = new Schema<AlgorithmsMeta>(
  {
    filter: String,
    ranker: String,
    flow: String,
  },
  { _id: false },
);

const generationSessionSchema = new Schema<GenerationSessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    moodQueryId: { type: Schema.Types.ObjectId, ref: "MoodQuery", required: true },
    candidates: [candidateSchema],
    ordering: [{ type: Schema.Types.ObjectId, ref: "Track" }],
    algorithms: algorithmsSchema,
    durationMs: Number,
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    error: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

generationSessionSchema.index({ userId: 1, createdAt: -1 });
generationSessionSchema.index({ moodQueryId: 1 });

const GenerationSession: Model<GenerationSessionDoc> = model<GenerationSessionDoc>(
  "GenerationSession",
  generationSessionSchema,
);

export default GenerationSession;
