import { type Document, type Model, type Types } from "mongoose";
export type FeedbackEventType = "play" | "pause" | "skip" | "like" | "dislike" | "add_to_playlist" | "remove_from_playlist";
export interface FeedbackEventDoc extends Document {
    userId: Types.ObjectId;
    trackId: Types.ObjectId;
    playlistId?: Types.ObjectId;
    event: FeedbackEventType;
    position?: number;
    elapsedMs?: number;
    contextJson?: string;
    createdAt: Date;
}
declare const FeedbackEvent: Model<FeedbackEventDoc>;
export default FeedbackEvent;
//# sourceMappingURL=FeedbackEvent.d.ts.map