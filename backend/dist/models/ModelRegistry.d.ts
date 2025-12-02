import { type Document, type Model } from "mongoose";
export interface ModelRegistryDoc extends Document {
    name: string;
    version: string;
    artifact?: string;
    metricsJson?: string;
    activatedAt?: Date;
}
declare const ModelRegistry: Model<ModelRegistryDoc>;
export default ModelRegistry;
//# sourceMappingURL=ModelRegistry.d.ts.map