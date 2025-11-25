import { Document, Model } from "mongoose";
export interface LocalUserDoc extends Document {
    name: string;
    email: string;
    passwordHash: string;
    verifyPassword(password: string): Promise<boolean>;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface LocalUserModel extends Model<LocalUserDoc> {
    createWithPassword(payload: {
        name: string;
        email: string;
        password: string;
    }): Promise<LocalUserDoc>;
}
declare const LocalUser: LocalUserModel;
export default LocalUser;
//# sourceMappingURL=LocalUser.d.ts.map