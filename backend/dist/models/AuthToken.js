import { Schema, model } from "mongoose";
const authTokenSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, required: true, enum: ["spotify"] },
    accessToken: { type: String, required: true },
    refreshToken: String,
    scope: String,
    expiresAt: Date,
}, {
    timestamps: true,
});
authTokenSchema.index({ userId: 1, provider: 1 });
const AuthToken = model("AuthToken", authTokenSchema);
export default AuthToken;
//# sourceMappingURL=AuthToken.js.map