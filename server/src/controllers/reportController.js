const mongoose = require('mongoose');
const { User, BillingCycle, UserBill, MealToggle, Deposit } = require('../models');
const { calculateBilling } = require('../utils/billingEngine');

const getReportData = async (req, res) => {
  const { userId, month } = req.params;

  if (req.user.role === 'user' && req.user.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const monthStart = new Date(`${month}-01`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const userObjId = new mongoose.Types.ObjectId(userId);

  const [
    user,
    billingCycle,
    userBill,
    toggles,
    depositsThisMonth,
    depositsBeforeAgg,
    prevLockedCycles,
  ] = await Promise.all([
    User.findById(userId).select('name roomNumber'),
    BillingCycle.findOne({ billingMonth: month }),
    UserBill.findOne({ userId, billingMonth: month }),
    MealToggle.find({ userId, date: { $regex: `^${month}-` } }).sort({ date: 1, mealType: 1 }),
    Deposit.find({ userId, date: { $gte: monthStart, $lt: monthEnd } })
      .select('date amount note')
      .sort({ date: 1 }),
    Deposit.aggregate([
      { $match: { userId: userObjId, date: { $lt: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    BillingCycle.find({ isLocked: true, billingMonth: { $lt: month } }).select('billingMonth'),
  ]);

  if (!user) return res.status(404).json({ message: 'User not found' });

  const isLocked = billingCycle?.isLocked ?? false;
  const isPreview = !isLocked;

  let mealRate = 0;
  let mealCost = 0;
  let otherCostShare = 0;
  let totalBill = 0;

  if (isLocked) {
    mealRate = billingCycle.mealRate ?? 0;
    mealCost = userBill?.mealCost ?? 0;
    otherCostShare = userBill?.otherCostShare ?? 0;
    totalBill = userBill?.totalBill ?? 0;
  } else {
    const preview = await calculateBilling(month);
    mealRate = preview.mealRate;
    const entry = preview.userBills.find((b) => b.userId.toString() === userId);
    if (entry) {
      mealCost = entry.mealCost;
      otherCostShare = entry.otherCostShare;
      totalBill = entry.totalBill;
    }
  }

  // Build day-by-day attendance from all toggle docs
  const attendanceMap = new Map();
  for (const t of toggles) {
    if (!attendanceMap.has(t.date)) attendanceMap.set(t.date, []);
    attendanceMap.get(t.date).push({ mealType: t.mealType, isOn: t.isOn, guestCount: t.guestCount });
  }
  const mealAttendance = [...attendanceMap.entries()].map(([date, ts]) => ({ date, toggles: ts }));

  const totalMealsByType = {};
  let totalGuestMeals = 0;
  for (const t of toggles) {
    if (t.isOn) {
      totalMealsByType[t.mealType] = (totalMealsByType[t.mealType] ?? 0) + 1;
      totalGuestMeals += t.guestCount ?? 0;
    }
  }

  // Opening balance: deposits strictly before this month minus locked bills before this month
  const depositsBeforeTotal = depositsBeforeAgg[0]?.total ?? 0;
  const prevLockedMonths = prevLockedCycles.map((c) => c.billingMonth);
  const billsBeforeAgg = prevLockedMonths.length > 0
    ? await UserBill.aggregate([
        { $match: { userId: userObjId, billingMonth: { $in: prevLockedMonths } } },
        { $group: { _id: null, total: { $sum: '$totalBill' } } },
      ])
    : [];
  const billsBeforeTotal = billsBeforeAgg[0]?.total ?? 0;
  const openingBalance = depositsBeforeTotal - billsBeforeTotal;

  const depositsThisMonthTotal = depositsThisMonth.reduce((sum, d) => sum + d.amount, 0);
  const closingBalance = openingBalance + depositsThisMonthTotal - totalBill;

  res.json({
    user: { name: user.name, roomNumber: user.roomNumber },
    billingMonth: month,
    mealAttendance,
    totalMealsByType,
    totalGuestMeals,
    mealRate,
    mealCost,
    otherCostShare,
    totalBill,
    deposits: depositsThisMonth.map((d) => ({ date: d.date, amount: d.amount, note: d.note })),
    openingBalance,
    closingBalance,
    isPreview,
  });
};

module.exports = { getReportData };
