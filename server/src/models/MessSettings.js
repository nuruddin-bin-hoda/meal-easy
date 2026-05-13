const mongoose = require('mongoose');

const messSettingsSchema = new mongoose.Schema({
  timezone: { type: String, default: 'Asia/Dhaka' },
  cutoffReminderMinutes: { type: Number, default: 30 },
  guestMealMonthlyLimit: { type: Number, default: 5 },
  lowBalanceThreshold: { type: Number, default: 100 },
  mealTypes: [{
    name: String,
    isActive: Boolean,
    isAutoEnabled: Boolean,
    cutoffTime: { type: String, default: '22:00' },
  }],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('MessSettings', messSettingsSchema);
