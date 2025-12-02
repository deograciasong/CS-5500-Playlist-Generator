import { type Document, type Model } from "mongoose";
export interface MoodDefaults {
    energyRange?: number[];
    brightnessRange?: number[];
    tempoRange?: number[];
}
export interface MoodDoc extends Document {
    key: string;
    label: string;
    defaults?: MoodDefaults;
    icon?: string;
    order: number;
}
declare const Mood: Model<MoodDoc>;
export default Mood;
//# sourceMappingURL=Mood.d.ts.map