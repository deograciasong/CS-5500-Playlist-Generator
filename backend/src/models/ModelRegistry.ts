import { Schema, model, type Document, type Model } from "mongoose";

export interface ModelRegistryDoc extends Document {
  name: string;
  version: string;
  artifact?: string;
  metricsJson?: string;
  activatedAt?: Date;
}

const modelRegistrySchema = new Schema<ModelRegistryDoc>({
  name: { type: String, required: true },
  version: { type: String, required: true },
  artifact: String,
  metricsJson: String,
  activatedAt: Date,
});

modelRegistrySchema.index({ name: 1, version: 1 }, { unique: true });
modelRegistrySchema.index({ activatedAt: -1 });

const ModelRegistry: Model<ModelRegistryDoc> = model<ModelRegistryDoc>(
  "ModelRegistry",
  modelRegistrySchema,
);

export default ModelRegistry;
