const mongoose = require('mongoose');

const chefSchema = new mongoose.Schema({
  name: String,
  phone: String,
  photo: String,
  loginUsername: { type: String, unique: true },
  loginPasswordHash: String,
  joinDate: Date,
  salaryAmount: Number,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Chef', chefSchema);
