import mongoose from "mongoose";

const modelRegistrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: { type: String, required: true },
  artifact: String, // Path or URL to model artifact
  metricsJson: String, // JSON string containing model metrics
  activatedAt: Date
});

// Compound index to ensure unique name-version combinations
modelRegistrySchema.index({ name: 1, version: 1 }, { unique: true });
modelRegistrySchema.index({ activatedAt: -1 });

export default mongoose.model("ModelRegistry", modelRegistrySchema);
