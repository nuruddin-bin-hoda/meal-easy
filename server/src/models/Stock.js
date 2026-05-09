const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  lowThreshold: { type: Number, required: true },
  isArchived: { type: Boolean, default: false },
  updatedBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
