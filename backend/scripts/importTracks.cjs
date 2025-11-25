#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const mongoose = require('mongoose');

const DEFAULT_BATCH = 500;

function parseMaybeJson(value) {
  if (!value) return null;
  value = String(value).trim();
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

function toBool(v) {
  if (v === undefined || v === null) return undefined;
  const s = String(v).toLowerCase().trim();
  return ['1', 'true', 'yes', 'y'].includes(s);
}

function toNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function parseArtistsField(val) {
  const j = parseMaybeJson(val);
  if (Array.isArray(j)) return j.map(a => ({ id: a.id ?? a.spotifyId ?? undefined, name: a.name ?? a }));
  if (!val) return [];
  const parts = String(val).split(/[;|,]/).map(s => s.trim()).filter(Boolean);
  return parts.map(p => ({ name: p }));
}

function parseFeatureVectorField(val) {
  const j = parseMaybeJson(val);
  if (Array.isArray(j)) return j.map(Number);
  if (!val) return undefined;
  const parts = String(val).split(/[;|,]/).map(s => s.trim()).filter(Boolean);
  return parts.map(Number).filter(n => !Number.isNaN(n));
}

function buildDocFromRecord(record) {
  // record is an object keyed by header names
  const obj = {};
  for (const k of Object.keys(record)) {
    obj[k.trim()] = record[k];
  }

  const doc = {};
  doc.spotifyTrackId = obj.spotifyTrackId ?? obj.spotify_id ?? obj.id ?? obj.track_id ?? obj['track id'] ?? undefined;
  doc.name = obj.name ?? obj.track_name ?? obj.title ?? obj['track name'] ?? undefined;

  const artistsRaw = obj.artists ?? obj.artist ?? obj['artist(s)'] ?? obj['artists'];
  doc.artists = parseArtistsField(artistsRaw);

  doc.album = {};
  doc.album.id = obj.album_id ?? obj.albumId ?? obj['album id'] ?? undefined;
  doc.album.name = obj.album_name ?? obj.album ?? obj['album name'] ?? undefined;

  const imagesRaw = obj.album_images ?? obj.album_image ?? obj.album_image_url ?? obj['album images'];
  const parsedImages = parseMaybeJson(imagesRaw);
  if (Array.isArray(parsedImages)) doc.album.images = parsedImages;
  else if (imagesRaw) doc.album.images = [{ url: imagesRaw }];

  doc.durationMs = toNumber(obj.durationMs ?? obj.duration_ms ?? obj.duration ?? obj['duration_ms']);
  doc.explicit = toBool(obj.explicit ?? obj['is_explicit']);
  doc.popularity = toNumber(obj.popularity);

  doc.audioFeatures = {};
  doc.audioFeatures.source = obj.audioFeatures_source ?? obj.source ?? 'spotify';
  doc.audioFeatures.tempo = toNumber(obj.tempo ?? obj.bpm);
  doc.audioFeatures.energy = toNumber(obj.energy);
  doc.audioFeatures.valence = toNumber(obj.valence);
  doc.audioFeatures.brightness = toNumber(obj.brightness);
  doc.audioFeatures.acousticness = toNumber(obj.acousticness);
  doc.audioFeatures.instrumentalness = toNumber(obj.instrumentalness);
  doc.audioFeatures.danceability = toNumber(obj.danceability);
  doc.audioFeatures.key = toNumber(obj.key);
  doc.audioFeatures.mode = toNumber(obj.mode);
  doc.audioFeatures.timeSignature = toNumber(obj.time_signature ?? obj.timeSignature);
  doc.audioFeatures.confidence = toNumber(obj.confidence ?? obj.audio_confidence);

  const fv = parseFeatureVectorField(obj.featureVector ?? obj.feature_vector ?? obj.features);
  if (fv) doc.featureVector = fv;

  if (obj.fetchedAt || obj.fetched_at) {
    const d = new Date(obj.fetchedAt ?? obj.fetched_at);
    if (!Number.isNaN(d.getTime())) doc.fetchedAt = d;
  }

  doc.source = obj.source ?? 'spotify';

  const analyzedAt = obj.analyzedAt ?? obj.analyzed_at ?? obj.analysis_analyzedAt;
  if (analyzedAt) {
    const d = new Date(analyzedAt);
    if (!Number.isNaN(d.getTime())) doc.analysis = { analyzedAt: d };
  }

  // drop undefined
  Object.keys(doc).forEach(k => { if (doc[k] === undefined) delete doc[k]; });
  return doc;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    console.error('Usage: node importTracks.cjs <csv-file> [--dry-run] [--batch=N]');
    process.exit(1);
  }
  const csvPath = argv[0];
  const dryRun = argv.includes('--dry-run');
  const batchArg = argv.find(a => a.startsWith('--batch='));
  const batch = batchArg ? Number(batchArg.split('=')[1]) : DEFAULT_BATCH;

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/playlist_generator';
  console.log('Connecting to', uri);
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;

  console.log('Reading CSV:', csvPath);
  const input = fs.createReadStream(csvPath);
  const parser = parse({ columns: true, skip_empty_lines: true, relax_quotes: true });

  let inserted = 0;
  let processed = 0;
  let batchDocs = [];

  parser.on('readable', async () => {
    let record;
    while ((record = parser.read())) {
      processed++;
      const doc = buildDocFromRecord(record);

      batchDocs.push(doc);
      if (batchDocs.length >= batch) {
        if (!dryRun) {
          try {
            const res = await db.collection('tracks').insertMany(batchDocs, { ordered: false });
            inserted += res.insertedCount || 0;
          } catch (e) {
            console.error('Insert error (continuing):', e.message || e);
          }
        }
        console.log(`Processed ${processed}, inserted ${inserted}`);
        batchDocs = [];
      }
    }
  });

  parser.on('error', err => {
    console.error('CSV parse error:', err);
  });

  parser.on('end', async () => {
    if (batchDocs.length > 0 && !dryRun) {
      try {
        const res = await db.collection('tracks').insertMany(batchDocs, { ordered: false });
        inserted += res.insertedCount || 0;
      } catch (e) {
        console.error('Insert error on final batch:', e.message || e);
      }
    }

    console.log(`Done. Processed=${processed} Inserted=${inserted} DryRun=${dryRun}`);
    await conn.close();
  });

  input.pipe(parser);
}

main().catch(err => {
  console.error('Import failed', err);
  process.exit(1);
});
