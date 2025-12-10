import express from "express";
import {
  addTracksToPlaylistHandler,
  createPlaylistForUser,
  replacePlaylistTracksHandler,
  reorderPlaylistTracksHandler,
} from "../controllers/spotify-playlist.controller.js";
import { generatePlaylistFromSpotify, generatePlaylistFromSpotifyGemini } from "../controllers/spotify-ai.controller.js";

const router = express.Router();

router.post("/generate", generatePlaylistFromSpotify);
router.post("/generate-gemini", generatePlaylistFromSpotifyGemini);
router.post("/", createPlaylistForUser);
router.post("/:playlistId/tracks", addTracksToPlaylistHandler);
router.put("/:playlistId/tracks", replacePlaylistTracksHandler);
router.post("/:playlistId/tracks/reorder", reorderPlaylistTracksHandler);

export default router;
