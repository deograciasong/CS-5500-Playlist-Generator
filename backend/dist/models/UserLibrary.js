import { Schema, model } from "mongoose";
const userLibrarySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    savedAt: { type: Date, default: Date.now },
    removedAt: Date,
    like: { type: Boolean, default: true },
    skipCount: { type: Number, default: 0 },
    lastHeardAt: Date,
});
userLibrarySchema.index({ userId: 1, trackId: 1 }, { unique: true });
userLibrarySchema.index({ userId: 1, savedAt: -1 });
const UserLibrary = model("UserLibrary", userLibrarySchema);
export default UserLibrary;
//# sourceMappingURL=UserLibrary.js.map