/**
 * Minimal logger helper to standardize prefixes and optional metadata.
 */
export function makeLogger(prefix) {
    const tag = prefix ? `[${prefix}]` : "";
    const info = (message, extra) => {
        if (extra !== undefined) {
            console.log(`${tag} ${message}`.trim(), extra);
        }
        else {
            console.log(`${tag} ${message}`.trim());
        }
    };
    const warn = (message, extra) => {
        if (extra !== undefined) {
            console.warn(`${tag} ${message}`.trim(), extra);
        }
        else {
            console.warn(`${tag} ${message}`.trim());
        }
    };
    return { info, warn };
}
export default makeLogger;
//# sourceMappingURL=logger.js.map