const mongoose = require('mongoose');

const chefBonusSchema = new mongoose.Schema({
  chefId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chef' },
  amount: Number,
  date: Date,
  reason: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ChefBonus', chefBonusSchema);
