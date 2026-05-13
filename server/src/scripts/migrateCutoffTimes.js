require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is not set in environment.');
  process.exit(1);
}

const DEFAULTS = {
  Breakfast: '22:00',
  Lunch:     '09:00',
  Dinner:    '15:00',
};

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const MessSettings = require('../models/MessSettings');
  const settings = await MessSettings.findOne();

  if (!settings) {
    console.log('No MessSettings document found. Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  let changed = false;
  settings.mealTypes = settings.mealTypes.map((mt) => {
    if (!mt.cutoffTime) {
      const defaultTime = DEFAULTS[mt.name] ?? '22:00';
      console.log(`  ${mt.name}: adding cutoffTime = ${defaultTime}`);
      changed = true;
      return { ...mt.toObject(), cutoffTime: defaultTime };
    }
    console.log(`  ${mt.name}: already has cutoffTime = ${mt.cutoffTime} (skipped)`);
    return mt;
  });

  if (changed) {
    await settings.save();
    console.log('Migration complete — MessSettings updated.');
  } else {
    console.log('All meal types already have cutoffTime — no changes needed.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
