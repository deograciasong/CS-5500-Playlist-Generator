import express from "express";
import {
  createSavedPlaylist,
  deleteSavedPlaylist,
  getSavedPlaylistById,
  listSavedPlaylists,
} from "../controllers/user-playlists.controller.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", listSavedPlaylists);
router.post("/", createSavedPlaylist);
router.get("/:id", getSavedPlaylistById);
router.delete("/:id", deleteSavedPlaylist);

export default router;
