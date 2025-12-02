import { Schema, model, type Document, type Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface LocalUserDoc extends Document {
  name: string;
  email: string;
  passwordHash: string;
  spotifyLinked: boolean;
  spotifyId?: string;
  spotifyProfile?: any;
  createdAt: Date;
  updatedAt: Date;
  verifyPassword(password: string): Promise<boolean>;
}

export interface LocalUserModel extends Model<LocalUserDoc> {
  createWithPassword(payload: { name: string; email: string; password: string }): Promise<LocalUserDoc>;
}

const localUserSchema = new Schema<LocalUserDoc, LocalUserModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    spotifyLinked: { type: Boolean, default: false },
    spotifyId: { type: String, unique: true, sparse: true },
    spotifyProfile: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

localUserSchema.methods.verifyPassword = function verifyPassword(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

localUserSchema.statics.createWithPassword = async function createWithPassword({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return this.create({ name, email, passwordHash: hash });
};

const LocalUser = model<LocalUserDoc, LocalUserModel>("LocalUser", localUserSchema);

export default LocalUser;
