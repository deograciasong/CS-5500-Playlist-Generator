import { Schema, model, type Document, type Model } from "mongoose";

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

const moodDefaultsSchema = new Schema<MoodDefaults>(
  {
    energyRange: [Number],
    brightnessRange: [Number],
    tempoRange: [Number],
  },
  { _id: false },
);

const moodSchema = new Schema<MoodDoc>({
  key: { type: String, required: true },
  label: { type: String, required: true },
  defaults: moodDefaultsSchema,
  icon: String,
  order: { type: Number, default: 0 },
});

moodSchema.index({ order: 1 });
moodSchema.index({ key: 1 }, { unique: true });

const Mood: Model<MoodDoc> = model<MoodDoc>("Mood", moodSchema);

export default Mood;
