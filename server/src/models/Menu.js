const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  date: { type: String, required: true },
  mealType: { type: String, required: true },
  items: [String],
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

menuSchema.index({ date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('Menu', menuSchema);
