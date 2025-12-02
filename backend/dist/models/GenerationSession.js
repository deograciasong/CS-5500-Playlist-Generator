import { Schema, model } from "mongoose";
const candidateSchema = new Schema({
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    score: Number,
    reasons: [String],
}, { _id: false });
const algorithmsSchema = new Schema({
    filter: String,
    ranker: String,
    flow: String,
}, { _id: false });
const generationSessionSchema = new Schema({
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
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
generationSessionSchema.index({ userId: 1, createdAt: -1 });
generationSessionSchema.index({ moodQueryId: 1 });
const GenerationSession = model("GenerationSession", generationSessionSchema);
export default GenerationSession;
//# sourceMappingURL=GenerationSession.js.map