/**
 * Minimal logger helper to standardize prefixes and optional metadata.
 */
export declare function makeLogger(prefix: string): {
    info: (message: string, extra?: any) => void;
    warn: (message: string, extra?: any) => void;
};
export default makeLogger;
//# sourceMappingURL=logger.d.ts.map