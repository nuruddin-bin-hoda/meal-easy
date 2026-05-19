const mongoose = require('mongoose');

const messSettingsSchema = new mongoose.Schema({
  timezone: { type: String, default: null },
  cutoffReminderMinutes: { type: Number, default: 30 },
  guestMealMonthlyLimit: { type: Number, default: 5 },
  lowBalanceThreshold: { type: Number, default: 100 },
  mealTypes: [{
    name: String,
    isActive: Boolean,
    isAutoEnabled: Boolean,
    cutoffTime: { type: String },
    createdAt: { type: Date, default: () => new Date() },
    deletedAt: { type: Date, default: null },
  }],
  lowBalanceAlertsEnabled:    { type: Boolean, default: true },
  menuUpdateAlertsEnabled:    { type: Boolean, default: false },
  monthlyReportAlertsEnabled: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('MessSettings', messSettingsSchema);
