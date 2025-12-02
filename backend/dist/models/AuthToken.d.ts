import { Document, Model, Types } from "mongoose";
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
declare const AuthToken: Model<AuthTokenDoc>;
export default AuthToken;
//# sourceMappingURL=AuthToken.d.ts.map