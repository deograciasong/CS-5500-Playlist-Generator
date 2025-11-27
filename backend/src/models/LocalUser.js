import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const localUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  // Optional Spotify linking
  spotifyId: { type: String, unique: true, sparse: true },
  spotifyProfile: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
});

// Instance method to check password
localUserSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Static helper to create user with hashed password
localUserSchema.statics.createWithPassword = async function({ name, email, password }) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return this.create({ name, email, passwordHash: hash });
};

export default mongoose.model("LocalUser", localUserSchema);
