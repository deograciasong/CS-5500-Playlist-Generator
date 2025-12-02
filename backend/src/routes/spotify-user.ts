import express from "express";
import {
  getCurrentUserProfile,
  getCurrentUserPlaylists,
  debugSpotifyCookies,
} from "../controllers/spotify-user.controller.js";

const router = express.Router();

router.get("/me", getCurrentUserProfile);
router.get("/me/playlists", getCurrentUserPlaylists);
router.get('/me/debug-cookies', debugSpotifyCookies);

export default router;
