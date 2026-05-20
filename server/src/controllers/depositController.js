const { Deposit, AuditLog } = require('../models');
const { sendPushToUser } = require('../utils/pushService');

const recordDeposit = async (req, res, next) => {
  try {
    const { userId, amount, date, note } = req.body;

    const deposit = await Deposit.create({
      userId,
      amount,
      date,
      note,
      recordedBy: req.user.userId,
    });

    sendPushToUser(deposit.userId, { title: 'Deposit Recorded', body: `Your deposit of ৳${Number(amount).toFixed(2)} has been recorded.` }).catch(() => {});

    await AuditLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'DEPOSIT_RECORDED',
      targetEntity: 'Deposit',
      targetId: deposit._id,
      oldValue: null,
      newValue: deposit.toObject(),
    });

    res.status(201).json({ deposit });
  } catch (err) {
    next(err);
  }
};

const listDeposits = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const [deposits, total] = await Promise.all([
      Deposit.find(filter)
        .populate('userId', 'name email')
        .populate('recordedBy', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Deposit.countDocuments(filter),
    ]);

    res.json({ deposits, total, page, limit });
  } catch (err) {
    next(err);
  }
};

const getUserDeposits = async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role === 'user' && userId !== req.params.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const deposits = await Deposit.find({ userId: req.params.userId })
      .populate('recordedBy', 'name email')
      .sort({ date: -1 });

    res.json({ deposits });
  } catch (err) {
    next(err);
  }
};

module.exports = { recordDeposit, listDeposits, getUserDeposits };
