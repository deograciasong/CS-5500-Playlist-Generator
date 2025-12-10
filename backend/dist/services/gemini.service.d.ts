export interface MoodDetectionResult {
    mood: string;
    reasoning: string;
    usedGemini: boolean;
    model: string;
}
export declare function fetchAvailableModels(apiKey: string, versions: string[]): Promise<string[]>;
export declare function detectMoodFromText(userInput: string, libraryContext?: string): Promise<MoodDetectionResult>;
//# sourceMappingURL=gemini.service.d.ts.map