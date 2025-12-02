type TargetVec = number[];
/**
 * Try to build a target 8-dimensional audio-feature vector for a freeform text.
 * If `VIBE_API_URL` is configured it will attempt to call that external service
 * and map the response into our vector shape. If the external call fails or is
 * not configured, we fall back to a local keyword-based heuristic.
 */
export declare function analyzeVibeText(text: string): Promise<TargetVec>;
export default analyzeVibeText;
//# sourceMappingURL=vibe-analyzer.d.ts.map