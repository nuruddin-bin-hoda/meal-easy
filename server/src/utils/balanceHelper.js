const mongoose = require('mongoose');
const { Deposit, UserBill, BillingCycle } = require('../models');

const getUserBalance = async (userId, upToMonth) => {
  // Aggregation $match does not auto-coerce types — always pass an ObjectId.
  const userObjId = new mongoose.Types.ObjectId(userId);

  const cycleFilter = { isLocked: true };
  if (upToMonth) cycleFilter.billingMonth = { $lte: upToMonth };

  const [depositResult, lockedCycles] = await Promise.all([
    Deposit.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    BillingCycle.find(cycleFilter).select('billingMonth'),
  ]);

  const totalDeposits = depositResult[0]?.total ?? 0;

  if (lockedCycles.length === 0) return totalDeposits;

  const lockedMonths = lockedCycles.map((c) => c.billingMonth);

  const billResult = await UserBill.aggregate([
    { $match: { userId: userObjId, billingMonth: { $in: lockedMonths } } },
    { $group: { _id: null, total: { $sum: '$totalBill' } } },
  ]);

  const totalBilled = billResult[0]?.total ?? 0;

  return totalDeposits - totalBilled;
};

module.exports = { getUserBalance };
