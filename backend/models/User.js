import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: String,
  displayName: String,
  spotifyId: String,
  accessToken: String,
  refreshToken: String,
});

export default mongoose.model("User", userSchema);