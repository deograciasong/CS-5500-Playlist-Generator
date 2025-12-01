import mongoose from "mongoose";

const authTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, required: true, enum: ['spotify'] },
  accessToken: { type: String, required: true },
  refreshToken: String,
  scope: String,
  expiresAt: Date
}, {
  timestamps: true
});

// Index for efficient lookups
authTokenSchema.index({ userId: 1, provider: 1 });

export default mongoose.model("AuthToken", authTokenSchema);
