import express from "express";
import {
  getCurrentUserProfile,
  getCurrentUserPlaylists,
} from "../controllers/spotify-user.controller.js";

const router = express.Router();

router.get("/me", getCurrentUserProfile);
router.get("/me/playlists", getCurrentUserPlaylists);

export default router;
