import { Schema, Document, Model, Types, model } from "mongoose";

export interface AuthTokenDoc extends Document {
  userId: Types.ObjectId;
  provider: "spotify";
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authTokenSchema = new Schema<AuthTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, required: true, enum: ["spotify"] },
    accessToken: { type: String, required: true },
    refreshToken: String,
    scope: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  },
);

authTokenSchema.index({ userId: 1, provider: 1 });

const AuthToken: Model<AuthTokenDoc> = model<AuthTokenDoc>(
  "AuthToken",
  authTokenSchema,
);

export default AuthToken;
