import 'dotenv/config';
import mongoose from 'mongoose';
import LocalUser from '../src/models/LocalUser.js';

async function run() {
  const mongo = process.env.MONGODB_URI;
  if (!mongo) {
    console.error('MONGODB_URI not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(mongo);
  console.log('Connected to MongoDB');

  // 1) For users that already have spotifyId set, ensure spotifyLinked is set
  const usersWithSpotify = await LocalUser.find({ spotifyId: { $exists: true, $ne: null } }).exec();
  console.log(`Found ${usersWithSpotify.length} users with spotifyId`);
  for (const u of usersWithSpotify) {
    let changed = false;
    if (!u.spotifyLinked) { u.spotifyLinked = true; changed = true; }
    // spotifyAccountId removed; consolidate on spotifyId
    if (changed) {
      await u.save();
      console.log(`Updated user ${u._id}: spotifyLinked=${u.spotifyLinked}`);
    }
  }

  // 2) For users without spotifyLinked field, set to false
  const res = await LocalUser.updateMany({ spotifyLinked: { $exists: false } }, { $set: { spotifyLinked: false } });
  console.log(`Set spotifyLinked=false on ${res.modifiedCount ?? res.nModified ?? res.modified} users (where missing)`);

  await mongoose.disconnect();
  console.log('Migration complete');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
