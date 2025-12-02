import { type Document, type Model, type Types } from "mongoose";
export interface Candidate {
    trackId: Types.ObjectId;
    score?: number;
    reasons?: string[];
}
export interface AlgorithmsMeta {
    filter?: string;
    ranker?: string;
    flow?: string;
}
export type GenerationStatus = "pending" | "processing" | "completed" | "failed";
export interface GenerationSessionDoc extends Document {
    userId: Types.ObjectId;
    moodQueryId: Types.ObjectId;
    candidates: Candidate[];
    ordering: Types.ObjectId[];
    algorithms?: AlgorithmsMeta;
    durationMs?: number;
    status: GenerationStatus;
    error?: string;
    createdAt: Date;
}
declare const GenerationSession: Model<GenerationSessionDoc>;
export default GenerationSession;
//# sourceMappingURL=GenerationSession.d.ts.map