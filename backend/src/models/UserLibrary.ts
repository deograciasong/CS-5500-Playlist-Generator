import { Schema, model, Document, Model, Types } from "mongoose";

export interface UserLibraryDoc extends Document {
  userId: Types.ObjectId;
  trackId: Types.ObjectId;
  savedAt: Date;
  removedAt?: Date;
  like: boolean;
  skipCount: number;
  lastHeardAt?: Date;
}

const userLibrarySchema = new Schema<UserLibraryDoc>({
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

const UserLibrary: Model<UserLibraryDoc> = model<UserLibraryDoc>(
  "UserLibrary",
  userLibrarySchema,
);

export default UserLibrary;
