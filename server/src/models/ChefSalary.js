const mongoose = require('mongoose');

const chefSalarySchema = new mongoose.Schema({
  chefId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chef' },
  billingMonth: String,
  salaryAmount: Number,
  paidStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  paidAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('ChefSalary', chefSalarySchema);
