export async function fetchCurrentUserProfile(api) {
    return api.get("/me");
}
export async function fetchCurrentUserPlaylists(api, options = {}) {
    const params = {};
    if (typeof options.limit === "number") {
        params.limit = options.limit;
    }
    if (typeof options.offset === "number") {
        params.offset = options.offset;
    }
    return api.get("/me/playlists", {
        params,
    });
}
//# sourceMappingURL=spotify-user.service.js.map