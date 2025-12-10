import type { Request, Response } from "express";
import mongoose from "mongoose";
import SavedPlaylist from "../models/SavedPlaylist.js";
import type { AuthenticatedRequest } from "../middleware/require-auth.js";

const COVER_EMOJIS = [
  "🎵",
  "🎶",
  "🎧",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "🥁",
  "🎤",
  "🎼",
  "🎙️",
  "📻",
];

function randomEmoji() {
  return COVER_EMOJIS[Math.floor(Math.random() * COVER_EMOJIS.length)];
}

function normalizeSavedAt(input: any): string {
  if (input instanceof Date) return input.toISOString();
  const asDate = new Date(input);
  return Number.isNaN(asDate.getTime()) ? new Date().toISOString() : asDate.toISOString();
}

function toResponse(payload: any) {
  const mood = (payload.playlist?.mood || "").toLowerCase();
  const desc = (payload.playlist?.description || "").toLowerCase();
  const generatorRaw = payload.playlist?.generator || "";
  const sourceRaw = payload.playlist?.source || "";
  const generatorLc = generatorRaw.toLowerCase();
  const sourceLc = sourceRaw.toLowerCase();
  const inferredGemini =
    payload.playlist?.isGemini === true ||
    generatorLc.includes("gemini") ||
    sourceLc.includes("gemini") ||
    mood.includes("gemini") ||
    desc.includes("gemini");

  return {
    id: String(payload._id),
    playlist: {
      ...payload.playlist,
      isGemini: inferredGemini,
      generator: generatorRaw || (inferredGemini ? "gemini" : ""),
      source: sourceRaw || (inferredGemini ? "gemini" : ""),
    },
    coverEmoji: payload.coverEmoji ?? randomEmoji(),
    savedAt: normalizeSavedAt(payload.createdAt ?? payload.updatedAt),
  };
}

function extractPlaylistPayload(body: any) {
  const playlist = body?.playlist ?? body;
  if (!playlist || typeof playlist.mood !== "string" || !Array.isArray(playlist.songs)) {
    return null;
  }
  return {
    mood: playlist.mood,
    description: typeof playlist.description === "string" ? playlist.description : "",
    songs: playlist.songs,
    isGemini: typeof playlist.isGemini === "boolean" ? playlist.isGemini : undefined,
    generator: typeof playlist.generator === "string" ? playlist.generator : undefined,
    source: typeof playlist.source === "string" ? playlist.source : undefined,
  };
}

function extractPlaylistUpdate(body: any) {
  const playlist = body?.playlist ?? body;
  if (!playlist) return null;

  const update: Record<string, any> = {};
  if (typeof playlist.mood === "string") {
    const mood = playlist.mood.trim();
    if (mood.length === 0) return null;
    update["playlist.mood"] = mood;
  }
  if (typeof playlist.description === "string") {
    update["playlist.description"] = playlist.description;
  }

  return Object.keys(update).length > 0 ? update : null;
}

export const createSavedPlaylist = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const playlist = extractPlaylistPayload(req.body);
  if (!playlist) {
    res.status(400).json({ error: "invalid_playlist_payload", message: "playlist with mood, description, and songs is required" });
    return;
  }

  const coverEmoji =
    typeof req.body?.coverEmoji === "string" && req.body.coverEmoji.trim().length > 0
      ? req.body.coverEmoji.trim()
      : randomEmoji();

  try {
    const doc = await SavedPlaylist.create({
      userId: authReq.authUserId,
      playlist,
      coverEmoji,
    });
    res.status(201).json({ playlist: toResponse(doc) });
  } catch (err) {
    console.error("Failed to save playlist", err);
    res.status(500).json({ error: "failed_to_save_playlist", message: "Unable to save playlist" });
  }
};

export const listSavedPlaylists = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const docs = await SavedPlaylist.find({ userId: authReq.authUserId }).sort({ createdAt: -1 }).lean();
    res.json({ playlists: docs.map(toResponse) });
  } catch (err) {
    console.error("Failed to list playlists", err);
    res.status(500).json({ error: "failed_to_load_playlists", message: "Unable to load playlists" });
  }
};

export const getSavedPlaylistById = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "invalid_playlist_id" });
    return;
  }

  try {
    const doc = await SavedPlaylist.findOne({ _id: id, userId: authReq.authUserId }).lean();
    if (!doc) {
      res.status(404).json({ error: "playlist_not_found" });
      return;
    }
    res.json({ playlist: toResponse(doc) });
  } catch (err) {
    console.error("Failed to fetch playlist", err);
    res.status(500).json({ error: "failed_to_load_playlist", message: "Unable to load playlist" });
  }
};

export const updateSavedPlaylist = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "invalid_playlist_id" });
    return;
  }

  const update = extractPlaylistUpdate(req.body);
  if (!update) {
    res.status(400).json({ error: "invalid_update_payload", message: "mood or description is required" });
    return;
  }

  try {
    const doc = await SavedPlaylist.findOneAndUpdate(
      { _id: id, userId: authReq.authUserId },
      { $set: update },
      { new: true },
    );
    if (!doc) {
      res.status(404).json({ error: "playlist_not_found" });
      return;
    }
    res.json({ playlist: toResponse(doc) });
  } catch (err) {
    console.error("Failed to update playlist", err);
    res.status(500).json({ error: "failed_to_update_playlist", message: "Unable to update playlist" });
  }
};

export const deleteSavedPlaylist = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "invalid_playlist_id" });
    return;
  }

  try {
    const deleted = await SavedPlaylist.findOneAndDelete({ _id: id, userId: authReq.authUserId }).lean();
    if (!deleted) {
      res.status(404).json({ error: "playlist_not_found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete playlist", err);
    res.status(500).json({ error: "failed_to_delete_playlist", message: "Unable to delete playlist" });
  }
};

export default {
  createSavedPlaylist,
  listSavedPlaylists,
  getSavedPlaylistById,
  updateSavedPlaylist,
  deleteSavedPlaylist,
};
