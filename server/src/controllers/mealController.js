const mongoose = require('mongoose');
const { MessSettings, MealToggle, AuditLog, User } = require('../models');
const { isCutoffPassed, getTomorrowDateString, getCurrentBillingMonth } = require('../utils/mealHelpers');

const getActiveMealTypes = async () => {
  const settings = await MessSettings.findOneAndUpdate(
    {},
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { settings, activeMealTypes: (settings.mealTypes ?? []).filter(mt => mt.isActive) };
};

const getTomorrowToggles = async (req, res, next) => {
  try {
    const tomorrow = getTomorrowDateString();
    const { activeMealTypes } = await getActiveMealTypes();

    const existing = await MealToggle.find({ userId: req.user.userId, date: tomorrow });
    const byType = Object.fromEntries(existing.map(t => [t.mealType, t]));

    const toggles = activeMealTypes.map(mt => ({
      mealType: mt.name,
      isOn: byType[mt.name]?.isOn ?? false,
      guestCount: byType[mt.name]?.guestCount ?? 0,
    }));

    res.json({ date: tomorrow, toggles });
  } catch (err) {
    next(err);
  }
};

const setToggle = async (req, res, next) => {
  try {
    const { mealType, isOn } = req.body;
    const guestCount = isOn ? (Number(req.body.guestCount) || 0) : 0;

    const user = await User.findById(req.user.userId).select('mealBlocked');
    if (!user || user.mealBlocked) {
      return res.status(403).json({ message: 'Your meal access is blocked' });
    }

    const { settings } = await getActiveMealTypes();
    if (isCutoffPassed(settings.cutoffTime)) {
      return res.status(400).json({ message: 'Meal toggle cutoff has passed' });
    }

    const tomorrow = getTomorrowDateString();
    const oldToggle = await MealToggle.findOne({ userId: req.user.userId, date: tomorrow, mealType });

    if (guestCount > 0) {
      const currentMonth = getCurrentBillingMonth();
      const agg = await MealToggle.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user.userId),
            date: { $regex: `^${currentMonth}` },
            ...(oldToggle ? { _id: { $ne: oldToggle._id } } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: '$guestCount' } } },
      ]);

      const otherGuests = agg[0]?.total ?? 0;
      if (otherGuests + guestCount > settings.guestMealMonthlyLimit) {
        return res.status(400).json({ message: 'Monthly guest meal limit reached' });
      }
    }

    const updated = await MealToggle.findOneAndUpdate(
      { userId: req.user.userId, date: tomorrow, mealType },
      { $set: { isOn, guestCount } },
      { upsert: true, new: true },
    );

    await AuditLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'MEAL_TOGGLE_CHANGED',
      targetEntity: 'MealToggle',
      targetId: updated._id,
      oldValue: oldToggle?.toObject() ?? null,
      newValue: updated.toObject(),
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const getMealHistory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { userId: req.user.userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const toggles = await MealToggle.find(filter).sort({ date: -1, mealType: 1 });
    res.json({ toggles });
  } catch (err) {
    next(err);
  }
};

const getMealCount = async (req, res, next) => {
  try {
    const { date, month } = req.query;

    if (!date && !month) {
      return res.status(400).json({ message: 'date or month query param required' });
    }

    const matchFilter = { isOn: true };
    if (date) {
      matchFilter.date = date;
    } else {
      matchFilter.date = { $regex: `^${month}` };
    }

    const counts = await MealToggle.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$mealType',
          userCount: { $sum: 1 },
          guestCount: { $sum: '$guestCount' },
        },
      },
      {
        $project: {
          _id: 0,
          mealType: '$_id',
          userCount: 1,
          guestCount: 1,
          totalPortions: { $add: ['$userCount', '$guestCount'] },
        },
      },
      { $sort: { mealType: 1 } },
    ]);

    res.json({ counts });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTomorrowToggles, setToggle, getMealHistory, getMealCount };
