import { Schema, model } from "mongoose";
const modelRegistrySchema = new Schema({
    name: { type: String, required: true },
    version: { type: String, required: true },
    artifact: String,
    metricsJson: String,
    activatedAt: Date,
});
modelRegistrySchema.index({ name: 1, version: 1 }, { unique: true });
modelRegistrySchema.index({ activatedAt: -1 });
const ModelRegistry = model("ModelRegistry", modelRegistrySchema);
export default ModelRegistry;
//# sourceMappingURL=ModelRegistry.js.map