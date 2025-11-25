import express from "express";
import { addTracksToPlaylistHandler, createPlaylistForUser, replacePlaylistTracksHandler, reorderPlaylistTracksHandler, } from "../controllers/spotify-playlist.controller.js";
const router = express.Router();
router.post("/", createPlaylistForUser);
router.post("/:playlistId/tracks", addTracksToPlaylistHandler);
router.put("/:playlistId/tracks", replacePlaylistTracksHandler);
router.post("/:playlistId/tracks/reorder", reorderPlaylistTracksHandler);
export default router;
//# sourceMappingURL=spotify-playlists.js.map