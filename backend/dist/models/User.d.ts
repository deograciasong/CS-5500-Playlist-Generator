import { type Document, type Model } from "mongoose";
export interface UserImage {
    url?: string;
    width?: number;
    height?: number;
}
export interface UserPreferences {
    defaultMoods: string[];
    brightnessRange: number[];
    energyRange: number[];
    tempoRange: number[];
}
export interface UserCapabilities {
    spotifyAudioFeatures: boolean;
    spotifyAudioAnalysis: boolean;
    previewUrlAvailable: boolean;
}
export interface UserDoc extends Document {
    spotifyUserId: string;
    displayName?: string;
    email?: string;
    country?: string;
    product?: string;
    images?: UserImage[];
    preferences: UserPreferences;
    capabilities: UserCapabilities;
    createdAt: Date;
    updatedAt: Date;
}
declare const User: Model<UserDoc>;
export default User;
//# sourceMappingURL=User.d.ts.map