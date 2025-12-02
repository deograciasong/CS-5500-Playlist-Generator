#!/usr/bin/env node
import 'dotenv/config';
import mongoose from 'mongoose';
// Use compiled/dist models (present when project is built) so this script can
// run without transpilation. Fall back to src if needed.
let SavedPlaylist;
try {
  SavedPlaylist = (await import('../dist/models/SavedPlaylist.js')).default;
} catch (e) {
  SavedPlaylist = (await import('../src/models/SavedPlaylist.js')).default;
}

const NEW_DESCRIPTION = 'Generated from your Spotify library (with some we think you would like)';

async function run() {
  const mongo = process.env.MONGODB_URI;
  if (!mongo) {
    console.error('MONGODB_URI not set in environment. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(mongo, { // reuse default options
    // useUnifiedTopology: true, useNewUrlParser: true are defaults in modern drivers
  });

  try {
    console.log('Connected to MongoDB, updating saved AI playlist descriptions...');
    const filter = { 'playlist.mood': { $regex: '^AI(\\s*playlist)?$', $options: 'i' } };
    const update = { $set: { 'playlist.description': NEW_DESCRIPTION } };
    const res = await SavedPlaylist.updateMany(filter, update);
    // mongoose 6 returns { acknowledged, modifiedCount, upsertedId, upsertedCount, matchedCount }
    console.log('Matched:', res.matchedCount ?? res.n ?? 'unknown');
    console.log('Modified:', res.modifiedCount ?? res.nModified ?? 'unknown');
  } catch (err) {
    console.error('Update failed:', err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run().catch((err) => {
  console.error('Script error', err);
  process.exit(1);
});
