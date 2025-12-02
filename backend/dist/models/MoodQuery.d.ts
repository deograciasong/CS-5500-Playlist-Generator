import { type Document, type Model, type Types } from "mongoose";
export interface ParsedMoodQuery {
    tempoRange?: number[];
    energyRange?: number[];
    brightnessRange?: number[];
    instrumentalOnly?: boolean;
    durationMsMax?: number;
}
export interface MoodQueryDoc extends Document {
    userId: Types.ObjectId;
    rawText: string;
    parsed?: ParsedMoodQuery;
    modelVersion?: string;
    createdAt: Date;
}
declare const MoodQuery: Model<MoodQueryDoc>;
export default MoodQuery;
//# sourceMappingURL=MoodQuery.d.ts.map