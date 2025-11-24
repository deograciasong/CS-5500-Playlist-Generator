#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/playlist_generator';
  console.log('Connecting to', uri);
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;

  const sourceName = 'localuserseedcjs';
  const targetName = 'localusers';

  const sourceExists = (await db.listCollections({ name: sourceName }).toArray()).length > 0;
  if (!sourceExists) {
    console.log('Source collection not found:', sourceName);
    await conn.close();
    return;
  }

  const docs = await db.collection(sourceName).find({}).toArray();
  console.log('Found', docs.length, 'documents in', sourceName);

  let moved = 0;
  let skipped = 0;

  for (const d of docs) {
    try {
      const email = d.email;
      if (!email) {
        console.log('Skipping document without email', d._id);
        skipped++;
        continue;
      }

      const existing = await db.collection(targetName).findOne({ email });
      if (existing) {
        console.log('Skipping existing target for', email);
        skipped++;
        // Optionally, remove the source doc to finish move
        await db.collection(sourceName).deleteOne({ _id: d._id });
        continue;
      }

      // Map fields — keep name, email, passwordHash, createdAt, updatedAt
      const toInsert = {
        spotifyUserId: `local:${email}`,
        displayName: d.name ?? null,
        email: email,
        images: d.images ?? [],
        preferences: d.preferences ?? undefined,
        capabilities: d.capabilities ?? undefined,
        createdAt: d.createdAt ?? new Date(),
        updatedAt: d.updatedAt ?? new Date(),
      };

      await db.collection(targetName).insertOne(toInsert);
      await db.collection(sourceName).deleteOne({ _id: d._id });
      console.log('Moved', email);
      moved++;
    } catch (err) {
      console.error('Error migrating doc', d._id, err.message || err);
    }
  }

  console.log(`Migration complete. moved=${moved}, skipped=${skipped}`);
  await conn.close();
}

main().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
