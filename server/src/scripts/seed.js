require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is not set in environment.');
  process.exit(1);
}

// Import models directly to avoid circular issues with barrel
const User = require('../models/User');
const MessSettings = require('../models/MessSettings');

const SUPERADMIN = {
  name: 'Super Admin',
  phone: '01700000000',
  password: 'superadmin123',
  role: 'superadmin',
  status: 'active',
  roomNumber: 'N/A',
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  // Super Admin
  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log('Super Admin already exists — skipping.');
  } else {
    const passwordHash = await bcrypt.hash(SUPERADMIN.password, 10);
    await User.create({ ...SUPERADMIN, passwordHash });
    console.log(`Super Admin created  phone=${SUPERADMIN.phone}  password=${SUPERADMIN.password}`);
  }

  // MessSettings singleton
  const settings = await MessSettings.findOne();
  if (settings) {
    console.log('MessSettings already exists — skipping.');
  } else {
    await MessSettings.create({
      cutoffReminderMinutes: 30,
      guestMealMonthlyLimit: 5,
      lowBalanceThreshold: 100,
      mealTypes: [
        { name: 'Breakfast', isActive: true,  isAutoEnabled: false, cutoffTime: '22:00' },
        { name: 'Lunch',     isActive: true,  isAutoEnabled: false, cutoffTime: '09:00' },
        { name: 'Dinner',    isActive: true,  isAutoEnabled: false, cutoffTime: '15:00' },
      ],
    });
    console.log('MessSettings created with defaults.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
