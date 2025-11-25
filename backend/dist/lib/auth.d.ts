import type { CookieOptions, Response } from "express";
export declare const secureCookieDefaults: CookieOptions;
export interface SpotifyCookiePayload {
    accessToken: string;
    expiresIn: number;
    refreshToken?: string;
}
/**
 * Generates a random token suitable for OAuth state parameters.
 */
export declare function generateStateToken(length?: number, alphabet?: string): string;
/**
 * Set Spotify access/refresh cookies using secure defaults.
 */
export declare function setSpotifyAuthCookies(res: Response, { accessToken, expiresIn, refreshToken }: SpotifyCookiePayload, overrides?: CookieOptions): void;
/**
 * Clear the temporary OAuth state cookie.
 */
export declare function clearSpotifyStateCookie(res: Response, overrides?: CookieOptions): void;
/**
 * Remove Spotify auth cookies, e.g. on logout.
 */
export declare function clearSpotifyAuthCookies(res: Response, overrides?: CookieOptions): void;
//# sourceMappingURL=auth.d.ts.map