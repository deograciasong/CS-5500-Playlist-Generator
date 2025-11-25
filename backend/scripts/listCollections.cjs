#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/playlist_generator';
  console.log('Connecting to', uri);
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;
  const cols = await db.listCollections().toArray();
  console.log('Collections in DB:', db.databaseName);
  cols.forEach(c => console.log(' -', c.name));

  // Show documents for collections that include 'user' in their name
  const userCols = cols.filter(c => /user/i.test(c.name));
  if (userCols.length === 0) {
    console.log('\nNo collections containing "user" found.');
  } else {
    for (const c of userCols) {
      console.log(`\nSample documents from collection: ${c.name}`);
      const docs = await db.collection(c.name).find({}).limit(5).toArray();
      if (docs.length === 0) console.log('  (no documents)');
      else console.dir(docs, { depth: 3 });
    }
  }

  await conn.close();
}

main().catch(err => {
  console.error('Failed to list collections', err);
  process.exit(1);
});
