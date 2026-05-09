const mongoose = require('mongoose');

const userBillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  billingMonth: String,
  mealCount: Number,
  guestMealCount: Number,
  mealCost: Number,
  otherCostShare: Number,
  totalBill: Number,
}, { timestamps: true });

module.exports = mongoose.model('UserBill', userBillSchema);
