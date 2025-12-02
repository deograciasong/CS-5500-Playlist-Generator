import axios from "axios";
const DEFAULT_TIMEOUT = 10_000;
const BASE_CONFIG = {
    timeout: DEFAULT_TIMEOUT,
    validateStatus: (status) => status >= 200 && status < 500,
};
export function createHttpClient(config = {}) {
    return axios.create({
        ...BASE_CONFIG,
        ...config,
        headers: {
            ...(BASE_CONFIG.headers ?? {}),
            ...(config.headers ?? {}),
        },
    });
}
export function postForm(client, url, form, config) {
    const body = new URLSearchParams(form).toString();
    return client.post(url, body, {
        ...config,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(config?.headers ?? {}),
        },
    });
}
export const spotifyAuthHttp = createHttpClient({
    baseURL: "https://accounts.spotify.com",
});
//# sourceMappingURL=http.js.map