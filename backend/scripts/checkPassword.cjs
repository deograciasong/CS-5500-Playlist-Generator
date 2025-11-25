#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/playlist_generator';
  console.log('Connecting to', uri);
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;

  const email = process.argv[2] || 'alice@example.com';
  const plain = process.argv[3] || 'password123';

  const doc = await db.collection('localusers').findOne({ email });
  if (!doc) {
    console.log('No localusers document found for', email);
    await conn.close();
    process.exit(0);
  }

  console.log('Found document for', email);
  console.log('passwordHash:', doc.passwordHash);

  const match = await bcrypt.compare(plain, doc.passwordHash);
  console.log('Password match?', match);

  await conn.close();
}

main().catch(err => {
  console.error('Error', err);
  process.exit(1);
});
