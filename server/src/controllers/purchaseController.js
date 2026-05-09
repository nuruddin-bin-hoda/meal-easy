const { Purchase, BillingCycle, AuditLog } = require('../models');

const toBillingMonth = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const createPurchase = async (req, res, next) => {
  try {
    const { buyerUserId, item, quantity, unit, price, date } = req.body;
    const billingMonth = toBillingMonth(date);

    const cycle = await BillingCycle.findOne({ billingMonth });
    if (cycle?.isLocked) {
      return res.status(400).json({ message: `Billing cycle for ${billingMonth} is locked.` });
    }

    const purchase = await Purchase.create({
      buyerUserId,
      item,
      quantity,
      unit,
      price,
      date,
      billingMonth,
      recordedBy: req.user.userId,
    });

    await AuditLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'PURCHASE_RECORDED',
      targetEntity: 'Purchase',
      targetId: purchase._id,
      oldValue: null,
      newValue: purchase.toObject(),
    });

    res.status(201).json({ purchase });
  } catch (err) {
    next(err);
  }
};

const listPurchases = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.buyerUserId) filter.buyerUserId = req.query.buyerUserId;
    if (req.query.item) filter.item = { $regex: req.query.item, $options: 'i' };
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .populate('buyerUserId', 'name email')
        .populate('recordedBy', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments(filter),
    ]);

    res.json({ purchases, total, page, limit });
  } catch (err) {
    next(err);
  }
};

const getPurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('buyerUserId', 'name email')
      .populate('recordedBy', 'name email');

    if (!purchase) return res.status(404).json({ message: 'Purchase not found.' });

    res.json({ purchase });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPurchase, listPurchases, getPurchase };
