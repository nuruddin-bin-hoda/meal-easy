const mongoose = require('mongoose');

const mealToggleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  mealType: { type: String, required: true },
  isOn: { type: Boolean, default: false },
  guestCount: { type: Number, default: 0 },
}, { timestamps: true });

mealToggleSchema.index({ userId: 1, date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('MealToggle', mealToggleSchema);
