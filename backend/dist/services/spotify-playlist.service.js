export async function createPlaylist(api, userId, payload) {
    return api.post(`/users/${userId}/playlists`, payload);
}
export async function addItemsToPlaylist(api, playlistId, payload) {
    return api.post(`/playlists/${playlistId}/tracks`, payload);
}
export async function replacePlaylistItems(api, playlistId, payload) {
    return api.put(`/playlists/${playlistId}/tracks`, payload);
}
export async function reorderPlaylistItems(api, playlistId, payload) {
    return api.put(`/playlists/${playlistId}/tracks`, payload);
}
//# sourceMappingURL=spotify-playlist.service.js.map