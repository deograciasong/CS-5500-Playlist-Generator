import { Schema, model } from "mongoose";
const moodDefaultsSchema = new Schema({
    energyRange: [Number],
    brightnessRange: [Number],
    tempoRange: [Number],
}, { _id: false });
const moodSchema = new Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    defaults: moodDefaultsSchema,
    icon: String,
    order: { type: Number, default: 0 },
});
moodSchema.index({ order: 1 });
moodSchema.index({ key: 1 }, { unique: true });
const Mood = model("Mood", moodSchema);
export default Mood;
//# sourceMappingURL=Mood.js.map