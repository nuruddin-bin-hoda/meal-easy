const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  buyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: String, required: true },
  quantity: Number,
  unit: String,
  price: { type: Number, required: true },
  date: { type: Date, required: true },
  billingMonth: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
