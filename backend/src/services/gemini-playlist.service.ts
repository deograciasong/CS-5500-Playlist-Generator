// @ts-nocheck
import axios from "axios";
import { fetchAvailableModels } from "./gemini.service.js";
const GEMINI_DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
const GEMINI_VERSIONS = [process.env.GEMINI_API_VERSION ?? "v1beta", "v1"].filter(Boolean);
const GEMINI_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro-001",
];
const COVER_EMOJIS = ["🎧", "🎵", "🌌", "🔥", "✨", "🌙", "💫", "🎶", "🌊", "☕️", "🌅", "🌃", "🏙️", "🌈", "⭐️"];
const filterStableFlash = (names) => names.filter((m) => /^gemini-(2\.5|2\.0|1\.5).*flash/i.test(m) &&
    !/lite|image|tts|computer-use|robotics|preview/i.test(m));
const isSpotifyId = (id) => typeof id === "string" && /^[A-Za-z0-9]{22}$/.test(id);
function pickCoverEmoji() {
    const idx = Math.floor(Math.random() * COVER_EMOJIS.length);
    return COVER_EMOJIS[idx] ?? "🎵";
}
function clamp01(v) {
    return Math.max(0, Math.min(1, v));
}
function extractCandidateText(payload) {
    const candidates = payload?.candidates;
    if (Array.isArray(candidates) && candidates.length > 0) {
        const parts = candidates[0]?.content?.parts;
        if (Array.isArray(parts)) {
            const texts = parts
                .map((part) => (typeof part?.text === "string" ? part.text.trim() : ""))
                .filter((t) => t.length > 0);
            if (texts.length > 0) {
                return texts.join(" ").trim();
            }
        }
    }
    return "";
}
function parseFeaturesJson(text) {
    if (!text || typeof text !== "string")
        return null;
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const cand = typeof fence?.[1] === "string" && fence[1].length > 0 ? fence[1] : text;
    try {
        const parsed = JSON.parse(cand);
        if (Array.isArray(parsed))
            return parsed;
        if (parsed && Array.isArray(parsed.tracks))
            return parsed.tracks;
    }
    catch {
        // ignore parse errors
    }
    return null;
}
export function logGeminiDebug(data) {
    const payload = { tag: "gemini-rank", ...data };
    console.log("[gemini-rank]", JSON.stringify(payload).slice(0, 1000));
}
function harvestArray(arr) {
    const ids = [];
    const features = {};
    arr.forEach((v) => {
        if (v && typeof v.id === "string") {
            const id = v.id;
            if (!isSpotifyId(id))
                return;
            ids.push(id);
            features[id] = {
                energy: typeof v.energy === "number" ? clamp01(v.energy) : undefined,
                valence: typeof v.valence === "number" ? clamp01(v.valence) : undefined,
                danceability: typeof v.danceability === "number" ? clamp01(v.danceability) : undefined,
                acousticness: typeof v.acousticness === "number" ? clamp01(v.acousticness) : undefined,
                instrumentalness: typeof v.instrumentalness === "number" ? clamp01(v.instrumentalness) : undefined,
                tempo: typeof v.tempo_bpm === "number" ? v.tempo_bpm : undefined,
            };
        }
        else if (typeof v === "string") {
            const id = v;
            if (!isSpotifyId(id))
                return;
            ids.push(id);
            if (!features[id])
                features[id] = {};
        }
    });
    return { ids: ids.filter(Boolean), features };
}
function parseIds(text, desired) {
    if (!text)
        return { ids: [], features: {} };
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = typeof fence?.[1] === "string" && fence[1].length > 0 ? fence[1] : text;
    const tryParse = (raw) => {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed))
                return harvestArray(parsed);
            if (parsed && Array.isArray(parsed.track_ids))
                return harvestArray(parsed.track_ids);
        }
        catch {
            // ignore
        }
        return null;
    };
    const direct = tryParse(candidate);
    if (direct)
        return direct;
    const first = candidate.indexOf("[");
    const last = candidate.lastIndexOf("]");
    if (first >= 0 && last > first) {
        const wide = tryParse(candidate.slice(first, last + 1));
        if (wide)
            return wide;
    }
    const bracket = candidate.match(/\[[\s\S]*?\]/);
    if (bracket?.[0]) {
        const narrow = tryParse(bracket[0]);
        if (narrow)
            return narrow;
    }
    const objMatches = Array.from(candidate.matchAll(/\{[^}]*"id"\s*:\s*"([^"]+)"[^}]*\}/g)).map((m) => m[0]);
    if (objMatches.length > 0) {
        const objs = [];
        for (const m of objMatches) {
            try {
                const parsedObj = JSON.parse(m);
                if (isSpotifyId(parsedObj?.id)) {
                    objs.push(parsedObj);
                }
            }
            catch {
                // ignore
            }
        }
        const harvested = harvestArray(objs);
        if (harvested.ids.length > 0)
            return harvested;
    }
    const rawIds = Array.from(candidate.matchAll(/[A-Za-z0-9]{22}/g)).map((m) => m[0]);
    if (rawIds.length > 0) {
        const ids = Array.from(new Set(rawIds)).slice(0, desired);
        return { ids, features: {} };
    }
    return { ids: [], features: {} };
}
export async function estimateAudioFeaturesWithGemini(tracks, existingMap) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        return;
    const missing = tracks.filter((t) => t?.id && !existingMap[t.id]);
    if (missing.length === 0)
        return;
    const trackSummaries = missing.map((t, idx) => {
        const artists = Array.isArray(t.artists) ? t.artists.map((a) => (a?.name || a)).join(", ") : "";
        const genre = (Array.isArray(t.genres) ? t.genres[0] : "") || (t.album?.genres && t.album.genres[0]) || "";
        return `${idx + 1}. id: ${t.id}, title: ${t.name || "Unknown"}, artist: ${artists || "Unknown"}, genre: ${genre || "unknown"}`;
    });
    const prompt = [
        "Estimate Spotify-like audio features for the following songs.",
        "Return strict JSON array of objects: [{id: spotify_id, danceability, energy, valence, acousticness, instrumentalness, liveness, speechiness, tempo_bpm}].",
        "All feature values must be 0..1. tempo_bpm should be 60-200. Use your best guess based on title/artist/genre.",
        trackSummaries.join("\n"),
    ].join("\n");
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 200 },
    };
    const versions = Array.from(new Set(GEMINI_VERSIONS));
    let models = ["gemini-2.5-flash"];
    for (const version of versions) {
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
                const resp = await axios.post(url, payload, { timeout: 8000 });
                const text = extractCandidateText(resp.data);
                const parsed = parseFeaturesJson(text);
                if (Array.isArray(parsed)) {
                    parsed.forEach((p) => {
                        const id = p.spotify_id || p.id || p.track_id;
                        if (!isSpotifyId(id) || existingMap[id])
                            return;
                        existingMap[id] = {
                            danceability: clamp01(p.danceability ?? 0.5),
                            energy: clamp01(p.energy ?? 0.5),
                            valence: clamp01(p.valence ?? 0.5),
                            acousticness: clamp01(p.acousticness ?? 0.2),
                            instrumentalness: clamp01(p.instrumentalness ?? 0.05),
                            liveness: clamp01(p.liveness ?? 0.1),
                            speechiness: clamp01(p.speechiness ?? 0.05),
                            tempo: typeof p.tempo_bpm === "number" ? p.tempo_bpm : typeof p.tempo === "number" ? p.tempo : 100,
                        };
                    });
                    return;
                }
            }
            catch (err) {
                logGeminiDebug({ stage: "feature_estimation_failed", model, version, message: err?.message ?? err });
            }
        }
    }
}
export async function rankTracksWithGemini(vibeText, tracks, desired) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        return { ids: [], features: {} };
    const versions = Array.from(new Set(GEMINI_VERSIONS));
    let models = [];
    try {
        const discovered = await fetchAvailableModels(apiKey, versions);
        const stable = filterStableFlash(discovered);
        models = Array.from(new Set([...stable, GEMINI_DEFAULT_MODEL, ...GEMINI_FALLBACK_MODELS]));
    }
    catch {
        models = Array.from(new Set([GEMINI_DEFAULT_MODEL, ...GEMINI_FALLBACK_MODELS]));
    }
    models = filterStableFlash(models);
    if (models.length === 0)
        models = ["gemini-2.5-flash"];
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, 80);
    if (sample.length === 0)
        return { ids: [], features: {} };
    const summaries = sample.map((t, idx) => {
        const artists = Array.isArray(t.artists) ? t.artists.map((a) => (a?.name || a)).join(", ") : "";
        const album = t.album?.name || "";
        return `${idx + 1}. id:${t.id}, title:${t.name || "Unknown"}, artist:${artists || "Unknown"}${album ? `, album:${album}` : ""}`;
    }).join("\n");
    const prompt = [
        "You are a professional DJ and music producer with deep knowledge across all genres, artists, and production styles.",
        "Your task is to select and rank songs from the listener’s saved library based on how well they match the listener’s stated mood or request.",
        `Listener mood/request: "${vibeText}"`,
        "From the list of songs below, identify the 20 best matches for the mood.",
        "Prioritize what the song itself suggests (title, artist, known style/lyrics cues); use inferred audio features (energy, valence, danceability, acousticness, instrumentalness, tempo) to break ties and keep the vibe consistent.",
        "Output Requirements:",
        "1. Return a strict JSON array of exactly 20 objects, ordered best-first. Never return fewer than 20; if you run out of strong matches, continue with the next best songs from the list until you have 20.",
        "2. Each object must have the structure: { \"id\": \"<spotify_id>\", \"energy\": <0-1>, \"valence\": <0-1>, \"danceability\": <0-1>, \"acousticness\": <0-1>, \"instrumentalness\": <0-1>, \"tempo_bpm\": 60-200 }.",
        "3. Do not output explanations, text outside JSON, or commentary.",
        "4. If you must infer feature values, base them on title/artist/genre/lyrics cues.",
        "Songs:",
        summaries,
    ].join("\n");
    logGeminiDebug({
        stage: "prompt",
        promptLength: prompt.length,
        sampleCount: sample.length,
        promptSnippet: prompt.slice(0, 600),
        generationConfig: { temperature: 0.35, maxOutputTokens: 800 },
    });
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 800 },
    };
    let best = null;
    for (const version of versions) {
        for (const model of models) {
            try {
                logGeminiDebug({ stage: "attempt", version, model, sampleCount: sample.length });
                const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
                const resp = await axios.post(url, payload, { timeout: 8000 });
                const text = extractCandidateText(resp.data);
                logGeminiDebug({
                    stage: "response",
                    version,
                    model,
                    textSnippet: typeof text === "string" ? text.slice(0, 800) : "",
                });
                const parsed = parseIds(text, desired);
                const featureSample = Object.entries(parsed.features || {})
                    .slice(0, 5)
                    .map(([id, f]) => ({
                    id,
                    energy: f.energy,
                    valence: f.valence,
                    danceability: f.danceability,
                }));
                logGeminiDebug({
                    stage: "parsed_ids",
                    version,
                    model,
                    idCount: parsed.ids.length,
                    ids: parsed.ids.slice(0, 20),
                    featureSample,
                });
                if (parsed.ids.length > 0) {
                    if (!best || parsed.ids.length > best.ids.length) {
                        best = { ids: parsed.ids.slice(0, desired), features: parsed.features };
                    }
                    if (parsed.ids.length >= desired)
                        return { ids: parsed.ids.slice(0, desired), features: parsed.features };
                }
            }
            catch {
                // try next model
            }
        }
    }
    // Force-20 retry
    try {
        const forceModel = models[0] ?? "gemini-2.5-flash";
        const forceVersion = versions[0] ?? "v1beta";
        const forcePrompt = [
            "You are a professional DJ and music producer ranking songs from the listener's saved library.",
            `Listener mood/request: "${vibeText}"`,
            "From the songs below, return exactly 20 JSON objects ordered best-first.",
            "Each object must be: { \"id\": \"<spotify_id>\", \"energy\": <0-1>, \"valence\": <0-1>, \"danceability\": <0-1>, \"acousticness\": <0-1>, \"instrumentalness\": <0-1>, \"tempo_bpm\": 60-200 }.",
            "Never return fewer than 20; if unsure, continue with the next best songs until you have 20.",
            "Do not include any text outside the JSON array.",
            "Songs:",
            summaries,
        ].join("\n");
        const forcePayload = {
            contents: [{ parts: [{ text: forcePrompt }] }],
            generationConfig: { temperature: 0.25, maxOutputTokens: 1600 },
        };
        logGeminiDebug({
            stage: "force20_attempt",
            version: forceVersion,
            model: forceModel,
            sampleCount: sample.length,
            promptLength: forcePrompt.length,
        });
        const forceUrl = `https://generativelanguage.googleapis.com/${forceVersion}/models/${forceModel}:generateContent?key=${apiKey}`;
        const resp = await axios.post(forceUrl, forcePayload, { timeout: 10000 });
        const text = extractCandidateText(resp.data);
        logGeminiDebug({
            stage: "force20_response",
            version: forceVersion,
            model: forceModel,
            textSnippet: typeof text === "string" ? text.slice(0, 800) : "",
        });
        const parsed = parseIds(text, desired);
        if (parsed.ids.length > 0) {
            logGeminiDebug({
                stage: "force20_result",
                count: parsed.ids.length,
                ids: parsed.ids.slice(0, 20),
            });
            const forceResult = { ids: parsed.ids.slice(0, desired), features: parsed.features };
            if (best && best.ids.length > forceResult.ids.length) {
                logGeminiDebug({ stage: "force20_keeping_best_partial", bestCount: best.ids.length });
                return best;
            }
            return forceResult;
        }
    }
    catch (e) {
        logGeminiDebug({ stage: "force20_failed", message: e?.message ?? String(e) });
    }
    if (best) {
        logGeminiDebug({ stage: "fallback_return_best_partial", count: best.ids.length });
        return best;
    }
    logGeminiDebug({ stage: "fallback", reason: "no_ids_from_gemini" });
    return { ids: [], features: {} };
}
export async function generatePlaylistMetaWithGemini(vibeText, songs) {
    const apiKey = process.env.GEMINI_API_KEY;
    const versions = Array.from(new Set(GEMINI_VERSIONS));
    let models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    if (apiKey) {
        try {
            const discovered = await fetchAvailableModels(apiKey, versions);
            const stable = filterStableFlash(discovered);
            if (stable.length > 0)
                models = stable;
        }
        catch {
            // ignore
        }
    }
    if (!apiKey || songs.length === 0) {
        return { title: `Gemini AI: ${vibeText}`, description: `AI-picked songs for "${vibeText}"`, emoji: pickCoverEmoji() };
    }
    const topSummaries = songs.slice(0, 10).map((s, idx) => {
        const artists = Array.isArray(s.artists) ? s.artists.join(", ") : s.artists || "";
        const energy = typeof s.energy === "number" ? `energy:${(s.energy * 100).toFixed(0)}%` : "";
        const valence = typeof s.valence === "number" ? `valence:${(s.valence * 100).toFixed(0)}%` : "";
        const tempo = typeof s.tempo === "number" ? `tempo:${Math.round((s.tempo || 0) * 200)}bpm` : "";
        const tags = [energy, valence, tempo].filter(Boolean).join(" ");
        return `${idx + 1}. ${s.track_name} — ${artists}${tags ? ` (${tags})` : ""}`;
    }).join("\n");
    const prompt = [
        "You curate playlists. Using the selected songs below, create a title, short description, and fitting emoji that reflect their vibe and the listener's request.",
        `Listener request: "${vibeText}"`,
        "Selected songs (with inferred feel):",
        topSummaries,
        'Return strict JSON: {"title": "<short title>", "description": "<<=140 chars>", "emoji": "<single emoji>"}.',
        "Do not include markdown or extra text.",
    ].join("\n");
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 200 },
    };
    const parseMeta = (text) => {
        try {
            const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
            const candidate = typeof fence?.[1] === "string" && fence[1].length > 0 ? fence[1] : text;
            const parsed = JSON.parse(candidate);
            if (parsed && typeof parsed === "object") {
                const title = parsed.title || parsed.name || "";
                const description = parsed.description || parsed.desc || "";
                const emoji = parsed.emoji || "";
                return { title, description, emoji };
            }
        }
        catch {
            // ignore
        }
        return null;
    };
    for (const version of versions) {
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
                const resp = await axios.post(url, payload, { timeout: 8000 });
                const text = extractCandidateText(resp.data);
                const meta = parseMeta(text);
                if (meta && meta.title) {
                    return {
                        title: meta.title.toString().slice(0, 60),
                        description: meta.description ? meta.description.toString().slice(0, 160) : `AI-picked songs for "${vibeText}"`,
                        emoji: meta.emoji && meta.emoji.length > 0 ? meta.emoji : pickCoverEmoji(),
                    };
                }
            }
            catch {
                // try next
            }
        }
    }
    return { title: `Gemini AI: ${vibeText}`, description: `AI-picked songs for "${vibeText}"`, emoji: pickCoverEmoji() };
}
//# sourceMappingURL=gemini-playlist.service.js.map
