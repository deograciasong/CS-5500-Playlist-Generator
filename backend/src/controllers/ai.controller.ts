import type { Request, Response } from "express";
import { detectMoodFromText } from "../services/gemini.service.js";
import { createSpotifyApiClient } from "../lib/spotify-api.js";
import { createSpotifyTokenManager } from "./helpers/spotify-token-manager.js";

export const detectMood = async (req: Request, res: Response) => {
  const userInput =
    typeof req.body?.userInput === "string"
      ? req.body.userInput
      : typeof req.body?.text === "string"
        ? req.body.text
        : "";

  if (!userInput || userInput.trim().length === 0) {
    res.status(400).json({ error: "missing_user_input", message: "userInput is required" });
    return;
  }

  // Best-effort: include a small sample of the user's library to give Gemini context.
  let libraryContext: string | undefined;
  try {
    const api = createSpotifyApiClient(createSpotifyTokenManager(req, res));
    const saved = await api.get<any>("/me/tracks?limit=25");
    const items = Array.isArray(saved?.items) ? saved.items : [];
    const summaries = items
      .map((it: any) => {
        const track = it?.track;
        if (!track) return null;
        const name = track.name || "";
        const artist = track.artists?.[0]?.name || "";
        const genre = (track.album?.genres && track.album.genres[0]) || "";
        const base = artist ? `${name} — ${artist}` : name;
        return genre ? `${base} (${genre})` : base;
      })
      .filter(Boolean)
      .slice(0, 20);
    if (summaries.length > 0) {
      libraryContext = summaries.join("; ");
    }
  } catch (e) {
    // ignore library context failures; Gemini will run without it
  }

  try {
    const result = await detectMoodFromText(userInput, libraryContext);
    res.json({
      mood: result.mood,
      reasoning: result.reasoning,
      model: result.model,
      usedGemini: result.usedGemini,
    });
  } catch (err) {
    console.error("Gemini mood detection error", err);
    res.status(500).json({ error: "mood_detection_failed", message: "Unable to analyze mood right now." });
  }
};

export default { detectMood };
