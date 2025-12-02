import axios from 'axios';

type TargetVec = number[];

/**
 * Try to build a target 8-dimensional audio-feature vector for a freeform text.
 * If `VIBE_API_URL` is configured it will attempt to call that external service
 * and map the response into our vector shape. If the external call fails or is
 * not configured, we fall back to a local keyword-based heuristic.
 */
export async function analyzeVibeText(text: string): Promise<TargetVec> {
  const normalized = String(text || '').trim();
  if (!normalized) return defaultVector();

  // If user configured an external vibe/sentiment API, try it first.
  const apiUrl = process.env.VIBE_API_URL;
  const apiKey = process.env.VIBE_API_KEY;
  if (apiUrl) {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const res = await axios.post(apiUrl, { text: normalized }, { headers, timeout: 5000 });
      const body = res.data ?? {};

      // Flexible mapping: accept several common field shapes
      // Prefer valence/energy if provided, otherwise use sentiment polarity.
      const valence = extractNumber(body, ['valence', 'happiness', 'joy', 'sentimentValence']) ??
        mapPolarityToValence(extractNumber(body, ['polarity', 'sentiment', 'sentimentScore']));
      const energy = extractNumber(body, ['energy', 'activation']) ?? 0.5;

      // tempo guess: allow external API to suggest bpm or energy-driven tempo
      let tempo = extractNumber(body, ['tempo', 'bpm']);
      if (typeof tempo !== 'number') tempo = 60 + (energy ?? 0.5) * 140;

      return buildVector({ valence: clamp01(valence ?? 0.5), energy: clamp01(energy ?? 0.5), tempo });
    } catch (e) {
      console.warn('Vibe analyzer external API failed, falling back to local heuristic', (e as any)?.message ?? e);
      // fall through to local heuristic
    }
  }

  // Local heuristic: richer keyword mapping
  const txt = normalized.toLowerCase();
  const tokens = txt.split(/\W+/).filter(Boolean);

  const wordLists: Record<string, string[]> = {
    positive: ['happy','joy','joyful','upbeat','energetic','excited','party','dance','cheerful','bright','positive','love','fun','good','celebrate','sunny','warm','glad'],
    negative: ['sad','melancholic','lonely','depressed','bitter','angry','dark','melancholy','sorrow','tear','blue','down','gloom'],
    highEnergy: ['energetic','upbeat','fast','dance','party','intense','pumping','aggressive','rock','electronic','edm','club','driving'],
    lowEnergy: ['calm','relax','chill','lofi','soft','ambient','mellow','smooth','quiet','sleepy','slow','gentle'],
    acoustic: ['acoustic','folk','acoustic guitar','acoustic piano','unplugged','stripped'],
    instrumental: ['instrumental','score','ambient','cinematic','ivory','piano','orchestral'],
    angry: ['angry','fury','rage','fierce'],
    tempoFast: ['fast','quick','upbeat','energetic','rapid','speedy','brisk'],
    tempoSlow: ['slow','downtempo','leisurely','calm','relaxed','ballad'],
  };

  let pos = 0, neg = 0, highE = 0, lowE = 0, acoustic = 0, instrumental = 0, angry = 0, tempoFast = 0, tempoSlow = 0;
  for (const t of tokens) {
    if (wordLists.positive.includes(t)) pos++;
    if (wordLists.negative.includes(t)) neg++;
    if (wordLists.highEnergy.includes(t)) highE++;
    if (wordLists.lowEnergy.includes(t)) lowE++;
    if (wordLists.acoustic.includes(t)) acoustic++;
    if (wordLists.instrumental.includes(t)) instrumental++;
    if (wordLists.angry.includes(t)) angry++;
    if (wordLists.tempoFast.includes(t)) tempoFast++;
    if (wordLists.tempoSlow.includes(t)) tempoSlow++;
  }

  const total = Math.max(1, pos + neg + highE + lowE + tempoFast + tempoSlow);
  const sentimentScore = clamp(-1, 1, (pos - neg) / total);
  const valence = (sentimentScore + 1) / 2; // 0..1
  let energy = 0.5 + (highE - lowE) * 0.12 + (tempoFast - tempoSlow) * 0.08 - angry * 0.05;
  energy = clamp01(energy);

  // tempo guess: base 75..160 influenced by energy and tempo tokens
  let tempo = 60 + energy * 140 + (tempoFast - tempoSlow) * 10 - (acoustic * 5);

  return buildVector({ valence, energy, tempo, acousticness: acoustic > 0 ? 0.8 : undefined, instrumentalness: instrumental > 0 ? 0.6 : undefined });
}

function extractNumber(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && !isNaN(Number(v))) return Number(v);
  }
  return undefined;
}

function mapPolarityToValence(p?: number) {
  if (typeof p !== 'number') return undefined;
  // assume p in -1..1
  return (p + 1) / 2;
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function clamp(min: number, max: number, v: number) { return Math.max(min, Math.min(max, v)); }

function defaultVector(): TargetVec {
  return [0.5, 0.5, 0.5, 0.5, 0.05, 0.1, 0.05, (60 + 0.5 * 140) / 200];
}

function buildVector(opts: { valence?: number; energy?: number; tempo?: number; acousticness?: number; instrumentalness?: number; } = {}): TargetVec {
  const valence = clamp01(opts.valence ?? 0.5);
  const energy = clamp01(opts.energy ?? 0.5);
  const acousticness = opts.acousticness ?? (1 - energy);
  const instrumentalness = opts.instrumentalness ?? 0.05;
  const tempo = typeof opts.tempo === 'number' ? opts.tempo : (60 + energy * 140);
  const tempoNorm = tempo / 200;

  const danceability = clamp01((energy * 0.6) + (valence * 0.4));

  return [
    danceability,
    energy,
    valence,
    clamp01(acousticness),
    clamp01(instrumentalness),
    0.1,
    0.05,
    clamp01(tempoNorm),
  ];
}

export default analyzeVibeText;
