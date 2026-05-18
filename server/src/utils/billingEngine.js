const { Purchase, OtherCost, MealToggle } = require('../models');

const calculateBilling = async (billingMonth) => {
  const [purchases, otherCosts, toggles] = await Promise.all([
    Purchase.find({ billingMonth }),
    OtherCost.find({ billingMonth }),
    MealToggle.find({ date: { $regex: `^${billingMonth}-` }, isOn: true }),
  ]);

  const totalItemCost = purchases.reduce((sum, p) => sum + p.price, 0);
  const totalOtherCost = otherCosts.reduce((sum, c) => sum + c.amount, 0);

  // Aggregate per-user counts from active toggles
  const userMap = new Map();
  for (const t of toggles) {
    const key = t.userId.toString();
    if (!userMap.has(key)) {
      userMap.set(key, { userId: t.userId, mealCount: 0, guestMealCount: 0 });
    }
    const entry = userMap.get(key);
    entry.mealCount += 1;
    entry.guestMealCount += t.guestCount || 0;
  }

  const activeUserCount = userMap.size;
  const totalMealCount = [...userMap.values()].reduce(
    (sum, u) => sum + u.mealCount + u.guestMealCount,
    0,
  );

  const mealRate = totalMealCount > 0 ? totalItemCost / totalMealCount : 0;
  const otherCostPerUser = activeUserCount > 0 ? totalOtherCost / activeUserCount : 0;

  const userBills = [...userMap.values()].map((u) => {
    const mealCost = mealRate * (u.mealCount + u.guestMealCount);
    const otherCostShare = otherCostPerUser;
    return {
      userId: u.userId,
      mealCount: u.mealCount,
      guestMealCount: u.guestMealCount,
      mealCost,
      otherCostShare,
      totalBill: mealCost + otherCostShare,
    };
  });

  return {
    totalItemCost,
    totalOtherCost,
    totalMealCount,
    mealRate,
    otherCostPerUser,
    activeUserCount,
    userBills,
  };
};

/**
 * Project the end-of-month meal rate by extrapolating today's spend and meal
 * pace to the full billing cycle. Unlike `mealRate` (purchase-cost only),
 * `projectedFinalRate` folds in other costs so it represents the true per-meal
 * cost a member will see on their final bill.
 *
 * Formula:
 *   projectedFinalRate = (totalItemCost + totalOtherCost) / totalMealCount
 *
 * This differs from `mealRate` which only divides purchase cost by meals.
 * Both numerator terms scale proportionally with time, so the ratio equals
 * the current all-in cost-per-meal — a stable leading indicator of the final bill.
 */
const projectRate = async (billingMonth) => {
  const result = await calculateBilling(billingMonth);

  const [year, month] = billingMonth.split('-').map(Number);
  const cycleDay = new Date().getDate();
  // days in month: day-0 of next month = last day of this month
  const cycleTotal = new Date(year, month, 0).getDate();

  const projectedFinalRate =
    result.totalMealCount > 0
      ? (result.totalItemCost + result.totalOtherCost) / result.totalMealCount
      : 0;

  return { projectedFinalRate, cycleDay, cycleTotal };
};

module.exports = { calculateBilling, projectRate };
