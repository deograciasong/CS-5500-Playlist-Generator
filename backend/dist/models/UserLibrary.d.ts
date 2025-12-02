import { Document, Model, Types } from "mongoose";
export interface UserLibraryDoc extends Document {
    userId: Types.ObjectId;
    trackId: Types.ObjectId;
    savedAt: Date;
    removedAt?: Date;
    like: boolean;
    skipCount: number;
    lastHeardAt?: Date;
}
declare const UserLibrary: Model<UserLibraryDoc>;
export default UserLibrary;
//# sourceMappingURL=UserLibrary.d.ts.map