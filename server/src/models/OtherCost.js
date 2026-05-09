const mongoose = require('mongoose');

const otherCostSchema = new mongoose.Schema({
  billingMonth: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('OtherCost', otherCostSchema);
