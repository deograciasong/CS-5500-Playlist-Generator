import axios from "axios";
import { makeLogger } from "../lib/logger.js";

export interface MoodDetectionResult {
  mood: string;
  reasoning: string;
  usedGemini: boolean;
  model: string;
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION ?? "v1beta";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com";
const FALLBACK_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-1.0-pro",
  "gemini-pro",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro-001",
];
const MODEL_CACHE_MS = 5 * 60 * 1000;

let cachedModelNames: string[] | null = null;
let cachedModelFetchedAt = 0;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};
type GeminiListModelsResponse = {
  models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
};

const { info: logInfo, warn: logWarn } = makeLogger("gemini-detect");

function decorateMood(label: string) {
  const trimmed = (label || "").trim();
  if (!trimmed) return "Gemini AI";
  if (trimmed.toLowerCase().includes("gemini")) return trimmed;
  const capitalized = `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
  return `Gemini AI: ${capitalized}`;
}

function extractCandidateText(payload: GeminiResponse | any) {
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

function parseJsonFromText(text: string) {
  if (!text) return null;
  const jsonFence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = typeof jsonFence?.[1] === "string" && jsonFence[1].length > 0 ? jsonFence[1] : text;
  const braceMatch = candidate.match(/\{[\s\S]*\}/);
  const raw = typeof braceMatch?.[0] === "string" && braceMatch[0].length > 0 ? braceMatch[0] : candidate;
  try {
    return JSON.parse(raw);
  } catch {
    // Try a looser parse: grab substring between first/last brace
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(candidate.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extractMoodFromPlainText(text: string) {
  if (!text) return "";
  const moodJson = text.match(/"mood"\s*:\s*"([^"]+)"/i);
  if (moodJson?.[1]) return moodJson[1].trim();
  const moodLine = text.match(/mood\s*[:\-]\s*([^\n\r]+)/i);
  if (moodLine?.[1]) return moodLine[1].trim();
  const labelLine = text.match(/label\s*[:\-]\s*([^\n\r]+)/i);
  if (labelLine?.[1]) return labelLine[1].trim();
  const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0);
  // If the first line is reasonably short, treat it as the mood label
  if (firstLine && firstLine.length <= 120) return firstLine;
  return "";
}

function cleanMoodValue(raw: string | undefined): string {
  const val = typeof raw === "string" ? raw.trim() : "";
  if (!val) return "";
  if (val.startsWith("{")) {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed.mood === "string" && parsed.mood.trim()) {
        return parsed.mood.trim();
      }
      if (parsed && typeof parsed.label === "string" && parsed.label.trim()) {
        return parsed.label.trim();
      }
    } catch {
      // ignore parse error
    }
  }
  return val;
}

function sanitizeMoodValue(raw: string | undefined): string {
  const cleaned = cleanMoodValue(raw);
  const trimmed = cleaned.trim();
  if (!trimmed) return "";
  // Drop obvious JSON fragments or incomplete objects like {"mood
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "";
  if (trimmed.includes("}")) return "";
  if (/["']?mood["']?/i.test(trimmed) && !/:/.test(trimmed)) return "";
  return trimmed;
}

function extractReasoningFromText(text: string, parsed: any): string | null {
  if (parsed && typeof parsed.reasoning === "string" && parsed.reasoning.trim().length > 0) {
    return parsed.reasoning.trim();
  }
  if (typeof text === "string") {
    const reasonJson = text.match(/"reasoning"\s*:\s*"([^"]+)"/i);
    if (reasonJson?.[1]) return reasonJson[1].trim();
  }
  return null;
}

function resolveMoodValue(candidateText: string, parsed: any, fallbackInput: string) {
  const fromParsed = sanitizeMoodValue(parsed?.mood);
  if (fromParsed) return fromParsed;
  const fromText = sanitizeMoodValue(extractMoodFromPlainText(candidateText));
  if (fromText) return fromText;
  // Try a looser regex for mood: handles single quotes and missing commas
  const regexMood = candidateText.match(/["']?mood["']?\s*[:=]\s*["']?([^"',}\n]+)/i);
  if (regexMood?.[1]) {
    const val = sanitizeMoodValue(regexMood[1]);
    if (val) return val;
  }
  // If the raw text starts with JSON, try to parse just the mood field
  if (candidateText.trim().startsWith("{")) {
    try {
      const partial = candidateText.replace(/[\r\n]/g, " ");
      const moodMatch = partial.match(/"mood"\s*:\s*"([^"]+)"/i);
      if (moodMatch?.[1]) {
        const val = sanitizeMoodValue(moodMatch[1]);
        if (val) return val;
      }
    } catch {
      // ignore
    }
  }
  const label = sanitizeMoodValue(parsed?.label) || sanitizeMoodValue(parsed?.tone);
  if (label) return label;
  // Last resort: first word(s) of fallback input
  const trimmed = fallbackInput.trim();
  if (trimmed.length > 0) {
    return trimmed.split(/\s+/).slice(0, 3).join(" ");
  }
  return "Custom Mood";
}

function normalizeModelName(name?: string) {
  if (!name) return "";
  return name.replace(/^models\//, "");
}

function unavailableResult(reason: string): MoodDetectionResult {
  return {
    mood: decorateMood("Unavailable"),
    reasoning: reason,
    usedGemini: false,
    model: "unavailable",
  };
}

export async function fetchAvailableModels(apiKey: string, versions: string[]): Promise<string[]> {
  const now = Date.now();
  if (cachedModelNames && now - cachedModelFetchedAt < MODEL_CACHE_MS) {
    logInfo("Using cached Gemini model list", { count: cachedModelNames.length });
    return cachedModelNames;
  }

  const collected: string[] = [];

  for (const version of versions) {
    logInfo("Listing Gemini models", { version });
    try {
      const res = await axios.get<GeminiListModelsResponse>(`${GEMINI_ENDPOINT}/${version}/models`, {
        params: { key: apiKey, pageSize: 200 },
        timeout: 5000,
      });
      const models = res.data?.models;
      if (Array.isArray(models)) {
        for (const m of models) {
          const supportsGenerate = Array.isArray(m.supportedGenerationMethods)
            ? m.supportedGenerationMethods.includes("generateContent")
            : false;
          if (!supportsGenerate) continue;
          const n = normalizeModelName(m.name);
          if (n) collected.push(n);
        }
      }
    } catch {
      // ignore and try next version
      logWarn("Failed to list models for version", version);
    }
  }

  const deduped = Array.from(new Set(collected));
  if (deduped.length > 0) {
    cachedModelNames = deduped;
    cachedModelFetchedAt = now;
    logInfo("Discovered Gemini models with generateContent", { count: deduped.length });
  }
  return deduped;
}

export async function detectMoodFromText(userInput: string, libraryContext?: string): Promise<MoodDetectionResult> {
  const text = (userInput || "").trim();
  if (!text) {
    throw new Error("User input is required for mood detection");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return unavailableResult("Gemini API key not configured");
  }

  const buildUrl = (version: string, model: string) =>
    `${GEMINI_ENDPOINT}/${version}/models/${model}:generateContent?key=${apiKey}`;
  const prompt = [
    "You classify a listener's desired musical mood for playlist creation.",
    "Return concise JSON with keys `mood` and `reasoning`.",
    "Keep `mood` short (<=6 words) but preserve the listener's key adjectives and energy/tempo cues (e.g., \"Happy upbeat pop\", \"Calm acoustic study\").",
    "Do not include any extra text or markdown outside of the JSON.",
    `Listener request: ${text}`,
    libraryContext ? `Sample from their library (artist/title): ${libraryContext}` : "",
  ].join("\n");

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 120,
    },
  };

  const versionsToTry = Array.from(
    new Set([GEMINI_API_VERSION, GEMINI_API_VERSION === "v1" ? "v1beta" : "v1"]),
  ).filter(Boolean);
  // Discover supported models first; prepend defaults so we still try them if present.
  const discovered = await fetchAvailableModels(apiKey, versionsToTry);
  const dynamicModels = discovered.filter(Boolean);
  const modelsToTry = Array.from(new Set([
    ...dynamicModels,
    DEFAULT_MODEL,
    ...FALLBACK_MODELS,
  ])).filter(Boolean);

  let lastError = "Gemini response was empty";
  const attempted: string[] = [];
  const fallbackLabel =
    text.trim().length > 0 ? text.trim().split(/\s+/).slice(0, 4).join(" ") : "Custom Mood";

  const attemptGenerate = async (version: string, model: string): Promise<MoodDetectionResult | null> => {
    const url = buildUrl(version, model);
    attempted.push(`${version}/${model}`);
    logInfo("Attempting Gemini mood detection", {
      version,
      model,
      promptLength: prompt.length,
    });
    try {
      const response = await axios.post<GeminiResponse>(url, payload, { timeout: 8000 });
      const candidateText = extractCandidateText(response.data);
      const parsed = parseJsonFromText(candidateText) ?? parseJsonFromText(JSON.stringify(response.data ?? {}));
      const moodValue = resolveMoodValue(
        typeof candidateText === "string" ? candidateText : "",
        parsed,
        text,
      );
      const moodClean = cleanMoodValue(moodValue) || fallbackLabel;

      if (!moodClean) {
        lastError = "Gemini returned no mood";
        return null;
      }

      const normalizedMood =
        moodClean.trim().length <= 3 && fallbackLabel ? fallbackLabel : moodClean.trim();
      const moodLabel = decorateMood(normalizedMood);

      const reasoning =
        extractReasoningFromText(typeof candidateText === "string" ? candidateText : "", parsed) ||
        (parsed?.explanation as string) ||
        (candidateText && typeof candidateText === "string" && candidateText.length > 0
          ? candidateText.slice(0, 400)
          : `Detected mood "${moodValue}"`);

      if (moodLabel && reasoning) {
        logInfo("Gemini mood detection succeeded", { version, model, mood: moodLabel });
        return {
          mood: moodLabel,
          reasoning,
          usedGemini: true,
          model: `${version}/${model}`,
        };
      }

      lastError = "Gemini response was empty";
      logWarn("Gemini response empty", { version, model });
      return null;
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || "Gemini request failed";
      lastError = message;
      logWarn("Gemini request failed", { version, model, message });
      return null;
    }
  };

  for (const version of versionsToTry) {
    for (const model of modelsToTry) {
      const result = await attemptGenerate(version, model);
      if (result) return result;
    }
  }

  // If static model list failed, try to discover supported models dynamically and retry
  try {
    const dynamicModels = await fetchAvailableModels(apiKey, versionsToTry);
    for (const version of versionsToTry) {
      for (const model of dynamicModels) {
        if (modelsToTry.includes(model)) continue; // already tried
        const result = await attemptGenerate(version, model);
        if (result) return result;
      }
    }
  } catch {
    // ignore and fall back
    logWarn("Failed to fetch dynamic Gemini model list");
  }

  const reason = attempted.length > 0 ? `${lastError} (attempted: ${attempted.join(", ")})` : lastError;
  logWarn("Gemini unavailable after retries", { reason });
  return unavailableResult(reason);
}
