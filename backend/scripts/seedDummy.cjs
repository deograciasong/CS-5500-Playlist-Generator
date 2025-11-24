#!/usr/bin/env node
// CommonJS seeder for projects using ESM package type
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/playlist_generator';
  console.log('Connecting to', uri);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const LocalUserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
  }, { timestamps: true });

  const LocalUser = mongoose.model('LocalUserSeedCJS', LocalUserSchema);

  const pw = 'password123';
  const hash = await bcrypt.hash(pw, 10);

  const users = [
    { name: 'Alice Example', email: 'alice@example.com', passwordHash: hash },
    { name: 'Bob Example', email: 'bob@example.com', passwordHash: hash }
  ];

  for (const u of users) {
    try {
      const exists = await LocalUser.findOne({ email: u.email }).lean();
      if (exists) {
        console.log('Skipping existing', u.email);
        continue;
      }
      const doc = await LocalUser.create(u);
      console.log('Inserted user', doc.email);
    } catch (err) {
      console.error('Insert error for', u.email, err.message || err);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding complete');
}

main().catch(err => {
  console.error('Seeder failed', err);
  process.exit(1);
});
