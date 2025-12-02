import { Schema, model } from "mongoose";
const parsedSchema = new Schema({
    tempoRange: [Number],
    energyRange: [Number],
    brightnessRange: [Number],
    instrumentalOnly: { type: Boolean, default: false },
    durationMsMax: Number,
}, { _id: false });
const moodQuerySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rawText: { type: String, required: true },
    parsed: parsedSchema,
    modelVersion: String,
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
moodQuerySchema.index({ userId: 1, createdAt: -1 });
const MoodQuery = model("MoodQuery", moodQuerySchema);
export default MoodQuery;
//# sourceMappingURL=MoodQuery.js.map