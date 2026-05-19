const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  photo: String,
  roomNumber: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  status: { type: String, enum: ['pending', 'active', 'blocked', 'deleted', 'rejected'], default: 'pending' },
  language: { type: String, enum: ['en', 'bn'], default: 'en' },
  notificationSubscription: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String,
    },
  },
  passwordHash: { type: String, required: true },
  mealBlocked: { type: Boolean, default: false },
  tokenVersion: { type: Number, default: 0 },
  deletedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
