const mongoose = require('mongoose');
const {
  User, MealToggle, Purchase, OtherCost, Deposit, Stock,
  ChefSalary, Chef, MessSettings, Menu, Notification,
  BillingCycle, UserBill,
} = require('../models');
const { calculateBilling, projectRate } = require('../utils/billingEngine');
const { getUserBalance } = require('../utils/balanceHelper');
const { getCurrentBillingMonth, isCutoffPassed, getTodayDateString, getTomorrowDateString } = require('../utils/mealHelpers');

const getAdminDashboard = async (req, res) => {
  const settings = await MessSettings.findOne();
  const timezone = settings?.timezone ?? 'Asia/Dhaka';

  const currentMonth = getCurrentBillingMonth(timezone);
  const todayStr = getTodayDateString(timezone);

  const monthStart = new Date(`${currentMonth}-01`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const [
    totalActiveUsers,
    todayToggleAgg,
    billing,
    purchaseAgg,
    otherCostAgg,
    depositAgg,
    lowStockItems,
    pendingUsers,
    activeChefs,
    currentSalaries,
    lockedCycles,
    allDepositsAgg,
    previousCycle,
    todayMenuDocs,
    projection,
  ] = await Promise.all([
    User.countDocuments({ status: 'active' }),
    MealToggle.aggregate([
      { $match: { date: todayStr, isOn: true } },
      { $group: { _id: '$mealType', userCount: { $sum: 1 }, guestCount: { $sum: '$guestCount' } } },
    ]),
    calculateBilling(currentMonth),
    Purchase.aggregate([
      { $match: { billingMonth: currentMonth } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]),
    OtherCost.aggregate([
      { $match: { billingMonth: currentMonth } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Deposit.aggregate([
      { $match: { date: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Stock.find({ isArchived: false, $expr: { $lte: ['$quantity', '$lowThreshold'] } })
      .select('itemName quantity unit lowThreshold'),
    User.find({ status: 'pending' }).select('_id name roomNumber createdAt').sort({ createdAt: -1 }),
    Chef.find({ isActive: true }).select('_id name salaryAmount'),
    ChefSalary.find({ billingMonth: currentMonth }).select('chefId paidStatus'),
    BillingCycle.find({ isLocked: true }).select('billingMonth'),
    Deposit.aggregate([{ $group: { _id: '$userId', total: { $sum: '$amount' } } }]),
    // Most recent locked cycle before current month — provides previousMonthRate
    BillingCycle.findOne({ isLocked: true, billingMonth: { $lt: currentMonth } })
      .select('billingMonth mealRate')
      .sort({ billingMonth: -1 }),
    // Today's menu items for the portions table
    Menu.find({ date: todayStr }),
    // Projection helper (cycleDay, cycleTotal, projectedFinalRate)
    projectRate(currentMonth),
  ]);

  // Build lookup maps
  const todayMenuMap = Object.fromEntries(
    todayMenuDocs.map((m) => [m.mealType.toLowerCase(), m.items ?? []]),
  );
  const mealTypeSettingsMap = Object.fromEntries(
    (settings?.mealTypes ?? []).map((mt) => [mt.name.toLowerCase(), mt]),
  );

  const todayMealCounts = todayToggleAgg.map((t) => ({
    mealType: t._id,
    userCount: t.userCount,
    guestCount: t.guestCount,
    totalPortions: t.userCount + t.guestCount,
    cutoffTime: mealTypeSettingsMap[t._id.toLowerCase()]?.cutoffTime ?? null,
    menuItems: todayMenuMap[t._id.toLowerCase()] ?? [],
  }));

  const todayTotalGuests = todayMealCounts.reduce((sum, t) => sum + t.guestCount, 0);

  const totalPurchasesThisMonth = purchaseAgg[0]?.total ?? 0;
  const totalOtherCostsThisMonth = otherCostAgg[0]?.total ?? 0;
  const totalDepositsThisMonth = depositAgg[0]?.total ?? 0;
  const totalMealsThisMonth = billing.totalMealCount;

  // Compute low-balance users via bulk aggregation
  const lockedMonths = lockedCycles.map((c) => c.billingMonth);
  const billsAgg = lockedMonths.length > 0
    ? await UserBill.aggregate([
        { $match: { billingMonth: { $in: lockedMonths } } },
        { $group: { _id: '$userId', total: { $sum: '$totalBill' } } },
      ])
    : [];

  const depositMap = new Map(allDepositsAgg.map((d) => [d._id.toString(), d.total]));
  const billMap = new Map(billsAgg.map((b) => [b._id.toString(), b.total]));

  const lowBalanceThreshold = settings?.lowBalanceThreshold ?? 100;
  const activeUsers = await User.find({ status: 'active' }).select('_id name roomNumber');
  const lowBalanceUsers = activeUsers
    .map((u) => {
      const balance = (depositMap.get(u._id.toString()) ?? 0) - (billMap.get(u._id.toString()) ?? 0);
      return {
        userId: u._id,
        name: u.name,
        roomNumber: u.roomNumber,
        balance,
        warn: balance < lowBalanceThreshold,
      };
    })
    .filter((u) => u.balance < lowBalanceThreshold);

  const salaryMap = new Map(currentSalaries.map((s) => [s.chefId.toString(), s.paidStatus]));
  const chefSalaryStatus = activeChefs.map((c) => ({
    chefId: c._id,
    name: c.name,
    salaryAmount: c.salaryAmount,
    paidStatus: salaryMap.get(c._id.toString()) ?? 'unpaid',
  }));

  res.json({
    totalActiveUsers,
    todayMealCounts,
    todayTotalGuests,
    predictedMealRate: billing.mealRate,
    previousMonthRate: previousCycle?.mealRate ?? null,
    totalPurchasesThisMonth,
    totalOtherCostsThisMonth,
    totalDepositsThisMonth,
    totalMealsThisMonth,
    cycleDay: projection.cycleDay,
    cycleTotal: projection.cycleTotal,
    projectedFinalRate: projection.projectedFinalRate,
    lowBalanceUsers,
    lowStockItems,
    pendingApprovals: { count: pendingUsers.length, users: pendingUsers },
    chefSalaryStatus,
  });
};

const getUserDashboard = async (req, res) => {
  const userId = req.user.userId;

  const settings = await MessSettings.findOne();
  const timezone = settings?.timezone ?? 'Asia/Dhaka';

  const currentMonth = getCurrentBillingMonth(timezone);
  const todayStr = getTodayDateString(timezone);
  const tomorrowStr = getTomorrowDateString(timezone);

  const [tomorrowMenuDocs, existingToggles, billing, myMealCountAgg, lowStockItems, recentNotifications] =
    await Promise.all([
      Menu.find({ date: tomorrowStr }),
      MealToggle.find({ userId, date: todayStr }).select('mealType isOn guestCount'),
      calculateBilling(currentMonth),
      MealToggle.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $regex: `^${currentMonth}-` }, isOn: true } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      Stock.find({ isArchived: false, $expr: { $lte: ['$quantity', '$lowThreshold'] } }).select('itemName'),
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(5),
    ]);

  const balance = await getUserBalance(userId);

  const tomorrowMenu = tomorrowMenuDocs.map((m) => ({ mealType: m.mealType, items: m.items }));

  const activeMealTypes = (settings?.mealTypes ?? []).filter(mt => mt.isActive);
  const byType = Object.fromEntries(existingToggles.map(t => [t.mealType, t]));
  const todayToggles = activeMealTypes.map(mt => ({
    mealType: mt.name,
    isOn: byType[mt.name]?.isOn ?? false,
    guestCount: byType[mt.name]?.guestCount ?? 0,
    cutoffTime: mt.cutoffTime ?? '22:00',
    isCutoffPassed: isCutoffPassed(mt.cutoffTime ?? '22:00', timezone),
  }));

  res.json({
    tomorrowMenu,
    todayToggles,
    balance,
    predictedMealRate: billing.mealRate,
    myMealCountThisMonth: myMealCountAgg[0]?.count ?? 0,
    lowStockWarnings: lowStockItems.map((s) => s.itemName),
    recentNotifications,
  });
};

const getChefDashboard = async (req, res) => {
  const settings = await MessSettings.findOne();
  const timezone = settings?.timezone ?? 'Asia/Dhaka';
  const todayStr = getTodayDateString(timezone);

  const [todayMenuDocs, todayPortionAgg, stock] = await Promise.all([
    Menu.find({ date: todayStr }),
    MealToggle.aggregate([
      { $match: { date: todayStr, isOn: true } },
      { $group: { _id: '$mealType', userCount: { $sum: 1 }, guestCount: { $sum: '$guestCount' } } },
    ]),
    Stock.find({ isArchived: false }),
  ]);

  const todayMenu = todayMenuDocs.map((m) => ({ mealType: m.mealType, items: m.items }));
  const todayPortions = todayPortionAgg.map((t) => ({
    mealType: t._id,
    totalPortions: t.userCount + t.guestCount,
  }));
  const stockWithFlag = stock.map((s) => ({
    _id: s._id,
    itemName: s.itemName,
    quantity: s.quantity,
    unit: s.unit,
    lowThreshold: s.lowThreshold,
    isLow: s.quantity <= s.lowThreshold,
  }));

  res.json({ todayMenu, todayPortions, stock: stockWithFlag });
};

module.exports = { getAdminDashboard, getUserDashboard, getChefDashboard };
