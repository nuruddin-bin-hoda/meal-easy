const mongoose = require('mongoose');

const billingCycleSchema = new mongoose.Schema({
  billingMonth: { type: String, required: true, unique: true },
  totalItemCost: Number,
  totalOtherCost: Number,
  totalMealCount: Number,
  mealRate: Number,
  otherCostPerUser: Number,
  activeUserCount: Number,
  isLocked: { type: Boolean, default: false },
  submittedAt: Date,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('BillingCycle', billingCycleSchema);
