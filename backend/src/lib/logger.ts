/**
 * Minimal logger helper to standardize prefixes and optional metadata.
 */
export function makeLogger(prefix: string) {
  const tag = prefix ? `[${prefix}]` : "";

  const info = (message: string, extra?: any) => {
    if (extra !== undefined) {
      console.log(`${tag} ${message}`.trim(), extra);
    } else {
      console.log(`${tag} ${message}`.trim());
    }
  };

  const warn = (message: string, extra?: any) => {
    if (extra !== undefined) {
      console.warn(`${tag} ${message}`.trim(), extra);
    } else {
      console.warn(`${tag} ${message}`.trim());
    }
  };

  return { info, warn };
}

export default makeLogger;

