import { Schema, model } from "mongoose";
const imageSchema = new Schema({
    url: String,
    width: Number,
    height: Number,
}, { _id: false });
const preferencesSchema = new Schema({
    defaultMoods: [String],
    brightnessRange: [Number],
    energyRange: [Number],
    tempoRange: [Number],
}, { _id: false });
const capabilitiesSchema = new Schema({
    spotifyAudioFeatures: { type: Boolean, default: false },
    spotifyAudioAnalysis: { type: Boolean, default: false },
    previewUrlAvailable: { type: Boolean, default: false },
}, { _id: false });
const userSchema = new Schema({
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
}, {
    timestamps: true,
});
const User = model("User", userSchema);
export default User;
//# sourceMappingURL=User.js.map