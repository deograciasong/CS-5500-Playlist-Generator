const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const cookieSecure = process.env.COOKIE_SECURE !== "false";
export const secureCookieDefaults = {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSecure ? "none" : "lax",
};
/**
 * Generates a random token suitable for OAuth state parameters.
 */
export function generateStateToken(length = 20, alphabet = DEFAULT_ALPHABET) {
    let token = "";
    const alphabetLength = alphabet.length;
    for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * alphabetLength);
        token += alphabet[index];
    }
    return token;
}
/**
 * Set Spotify access/refresh cookies using secure defaults.
 */
export function setSpotifyAuthCookies(res, { accessToken, expiresIn, refreshToken }, overrides) {
    const cookieOptions = { ...secureCookieDefaults, ...overrides };
    res.cookie("spotify_access_token", accessToken, {
        ...cookieOptions,
        maxAge: expiresIn * 1000,
    });
    if (refreshToken) {
        res.cookie("spotify_refresh_token", refreshToken, cookieOptions);
    }
}
/**
 * Clear the temporary OAuth state cookie.
 */
export function clearSpotifyStateCookie(res, overrides) {
    res.clearCookie("spotify_auth_state", {
        ...secureCookieDefaults,
        ...overrides,
    });
}
/**
 * Remove Spotify auth cookies, e.g. on logout.
 */
export function clearSpotifyAuthCookies(res, overrides) {
    const cookieOptions = { ...secureCookieDefaults, ...overrides };
    res.clearCookie("spotify_access_token", cookieOptions);
    res.clearCookie("spotify_refresh_token", cookieOptions);
}
//# sourceMappingURL=auth.js.map