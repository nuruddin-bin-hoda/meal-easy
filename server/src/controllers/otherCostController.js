const { OtherCost, BillingCycle } = require('../models');

const createOtherCost = async (req, res, next) => {
  try {
    const { billingMonth, description, amount } = req.body;

    const cycle = await BillingCycle.findOne({ billingMonth });
    if (cycle?.isLocked) {
      return res.status(400).json({ message: `Billing cycle for ${billingMonth} is locked.` });
    }

    const cost = await OtherCost.create({
      billingMonth,
      description,
      amount,
      recordedBy: req.user.userId,
    });

    res.status(201).json({ cost });
  } catch (err) {
    next(err);
  }
};

const listOtherCosts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.billingMonth) filter.billingMonth = req.query.billingMonth;

    const costs = await OtherCost.find(filter)
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ costs });
  } catch (err) {
    next(err);
  }
};

const deleteOtherCost = async (req, res, next) => {
  try {
    const cost = await OtherCost.findById(req.params.id);
    if (!cost) return res.status(404).json({ message: 'Cost not found.' });

    const cycle = await BillingCycle.findOne({ billingMonth: cost.billingMonth });
    if (cycle?.isLocked) {
      return res.status(400).json({ message: `Billing cycle for ${cost.billingMonth} is locked.` });
    }

    await cost.deleteOne();

    res.json({ message: 'Cost deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOtherCost, listOtherCosts, deleteOtherCost };
