import express from "express";
import { detectMood } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = express.Router();

router.post("/detect-mood", requireAuth, detectMood);

export default router;

