import type { Document, Model } from "mongoose";

export interface LocalUserDoc extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  verifyPassword(password: string): Promise<boolean>;
}

export interface LocalUserModel extends Model<LocalUserDoc> {
  createWithPassword(payload: { name: string; email: string; password: string }): Promise<LocalUserDoc>;
}

declare const LocalUser: LocalUserModel;
export default LocalUser;
