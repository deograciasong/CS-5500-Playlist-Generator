import axios from 'axios';
// tsc may complain about missing types for the JS model; silence here
// @ts-ignore
import Track from '../models/Track.js';

function cosineSimilarity(a: number[], b: number[]) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function meanVector(vs: number[][]) {
  if (!vs || vs.length === 0) return null;
  const dim = vs[0]!.length;
  const out = new Array(dim).fill(0);
  for (const v of vs) {
    for (let i = 0; i < dim; i++) out[i] += (v[i] ?? 0);
  }
  for (let i = 0; i < dim; i++) out[i] /= vs.length;
  return out;
}

async function fetchAllSavedTrackIds(accessToken: string, maxItems = 500) {
  const ids: string[] = [];
  let url = `https://api.spotify.com/v1/me/tracks?limit=50`;
  while (url && ids.length < maxItems) {
    let resp;
    try {
      resp = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        const e: any = new Error('missing_spotify_scope');
        e.code = 'missing_spotify_scope';
        e.publicMessage = 'Missing Spotify scope `user-library-read`. Please re-link your Spotify account with that permission.';
        throw e;
      }
      throw err;
    }
    const items = resp.data.items || [];
    for (const it of items) {
      const id = it?.track?.id;
      if (id) ids.push(id);
      if (ids.length >= maxItems) break;
    }
    url = resp.data.next;
  }
  return ids;
}

export async function generatePlaylistFromSpotify(opts: { spotifyAccessToken: string; length?: number; mood?: string }) {
  const { spotifyAccessToken, length = 30 } = opts;
  // 1) fetch user's saved spotify ids
  const savedIds = await fetchAllSavedTrackIds(spotifyAccessToken, 500);
  if (!savedIds.length) {
    const e: any = new Error('no_saved_tracks');
    e.code = 'no_saved_tracks';
    e.publicMessage = 'No saved tracks found in your Spotify library.';
    throw e;
  }

  // 2) look up local Track docs for saved ids
  const localSaved = await Track.find({ spotifyTrackId: { $in: savedIds } }).lean().exec();

  // 3) gather feature vectors for the user's saved tracks present in dataset
  const vectors: number[][] = [];
  for (const t of localSaved) {
    if (Array.isArray(t.featureVector) && t.featureVector.length) vectors.push(t.featureVector);
    else if (t.audioFeatures && typeof t.audioFeatures === 'object') {
      // simple fallback: construct small vector from some audio features
      const af = t.audioFeatures;
      const v = [af.danceability ?? 0, af.energy ?? 0, af.valence ?? 0, af.acousticness ?? 0, af.tempo ?? 0];
      vectors.push(v);
    }
  }

  // 4) compute user profile vector
  let userVector: number[] | null = null;
  if (vectors.length) userVector = meanVector(vectors as number[][]);

  const outTracks: Array<any> = [];

  // include a subset of saved tracks (familiarity)
  try {
    const savedSample = savedIds.slice(0, Math.min(12, savedIds.length));
    // fetch metadata via Spotify to include in returned items
    if (savedSample.length) {
      const meta = await axios.get(`https://api.spotify.com/v1/tracks?ids=${savedSample.join(',')}`, { headers: { Authorization: `Bearer ${spotifyAccessToken}` } });
      for (const t of meta.data.tracks || []) {
        outTracks.push({ spotifyId: t.id, title: t.name, artists: (t.artists || []).map((a: any) => a.name).join(', ') });
      }
    }
  } catch (e) {
    // ignore metadata failures
  }

  // 5) find candidate new tracks from dataset using vector similarity when available
  if (userVector) {
    // scan dataset for tracks with featureVector and compute similarity
    const cursor = Track.find({ featureVector: { $exists: true, $ne: [] } }).cursor();
    const scored: Array<{ t: any; score: number }> = [];
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      if (savedIds.includes(String(doc.spotifyTrackId))) continue; // skip already owned
      const fv = doc.featureVector;
      if (!Array.isArray(fv)) continue;
      const s = cosineSimilarity(userVector, fv as number[]);
      if (s > 0) scored.push({ t: doc, score: s });
    }
    scored.sort((a, b) => b.score - a.score);
    for (const s of scored.slice(0, Math.max(0, (length - outTracks.length)))) {
      outTracks.push({ spotifyId: s.t.spotifyTrackId, title: s.t.name, artists: (s.t.artists || []).map((a: any) => a.name).join(', ') });
    }
  }

  // 6) fallback: if not enough candidates, call Spotify recommendations
  if (outTracks.length < length) {
    const seeds = savedIds.slice(0, 5);
    try {
      const recUrl = `https://api.spotify.com/v1/recommendations?limit=${Math.min(100, Math.max(20, length * 2))}` + (seeds.length ? `&seed_tracks=${seeds.join(',')}` : '');
      const r = await axios.get(recUrl, { headers: { Authorization: `Bearer ${spotifyAccessToken}` } });
      const recs = (r.data.tracks || []).map((t: any) => ({ spotifyId: t.id, title: t.name, artists: (t.artists || []).map((a: any) => a.name).join(', ') }));
      for (const r0 of recs) {
        if (outTracks.length >= length) break;
        if (savedIds.includes(r0.spotifyId)) continue;
        if (!outTracks.find((x) => x.spotifyId === r0.spotifyId)) outTracks.push(r0);
      }
    } catch (e) {
      // ignore
    }
  }

  // Trim to requested length
  const final = outTracks.slice(0, length);
  return { name: `AI-generated playlist`, description: `Generated from your Spotify library and dataset`, tracks: final };
}

export async function savePlaylistToSpotify(_opts: { spotifyAccessToken: string; userId: string; name: string; description?: string; trackSpotifyIds: string[] }) {
  throw new Error('savePlaylistToSpotify not implemented in generator service');
}

export default { generatePlaylistFromSpotify, savePlaylistToSpotify };
