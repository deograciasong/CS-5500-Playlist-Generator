#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/playlist_generator';
  console.log('Connecting to', uri);
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;

  const cursor = db.collection('localusers').find({ spotifyUserId: { $regex: '^local:' } });
  let updated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (doc.passwordHash) {
      console.log('Skipping', doc.email, '- already has passwordHash');
      continue;
    }
    const plain = 'password123';
    const hash = await bcrypt.hash(plain, 10);
    await db.collection('localusers').updateOne({ _id: doc._id }, { $set: { passwordHash: hash } });
    console.log('Set passwordHash for', doc.email);
    updated++;
  }

  console.log('Done. updated=', updated);
  await conn.close();
}

main().catch(err => {
  console.error('Error', err);
  process.exit(1);
});
