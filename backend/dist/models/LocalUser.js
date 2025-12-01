import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const localUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    // Spotify linking fields (kept in sync with src model)
    spotifyLinked: { type: Boolean, default: false },
    spotifyId: { type: String, unique: true, sparse: true },
    spotifyProfile: { type: mongoose.Schema.Types.Mixed },
}, {
    timestamps: true,
});
localUserSchema.methods.verifyPassword = function (password) {
    return bcrypt.compare(password, this.passwordHash);
};
;
localUserSchema.statics.createWithPassword = async function ({ name, email, password }) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return this.create({ name, email, passwordHash: hash });
};
const LocalUser = mongoose.model("LocalUser", localUserSchema);
export default LocalUser;
//# sourceMappingURL=LocalUser.js.map