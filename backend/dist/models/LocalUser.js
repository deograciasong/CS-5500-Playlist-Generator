import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
const localUserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    spotifyLinked: { type: Boolean, default: false },
    spotifyId: { type: String, unique: true, sparse: true },
    spotifyProfile: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
});
localUserSchema.methods.verifyPassword = function verifyPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
};
localUserSchema.statics.createWithPassword = async function createWithPassword({ name, email, password, }) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return this.create({ name, email, passwordHash: hash });
};
const LocalUser = model("LocalUser", localUserSchema);
export default LocalUser;
//# sourceMappingURL=LocalUser.js.map