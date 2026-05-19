const { Menu, MessSettings, AuditLog } = require('../models');
const { getTomorrowDateString } = require('../utils/mealHelpers');

function toLocalDateStr(date, timezone) {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(date));
}

async function getActiveMealTypesForDate(date) {
  const settings = await MessSettings.findOne();
  if (!settings?.mealTypes?.length) return [];

  const timezone = settings.timezone || 'UTC';

  return settings.mealTypes
    .filter((mt) => {
      const created = toLocalDateStr(mt.createdAt, timezone) ?? '2000-01-01';
      const deleted = toLocalDateStr(mt.deletedAt, timezone);
      return created <= date && (!deleted || deleted > date);
    })
    .sort((a, b) => {
      const ad = toLocalDateStr(a.createdAt, timezone) ?? '2000-01-01';
      const bd = toLocalDateStr(b.createdAt, timezone) ?? '2000-01-01';
      return ad < bd ? -1 : ad > bd ? 1 : 0;
    })
    .map((mt) => ({ name: mt.name, cutoffTime: mt.cutoffTime }));
}

const setMenu = async (req, res, next) => {
  try {
    const { date, mealType, items } = req.body;

    const old = await Menu.findOne({ date, mealType });

    const updated = await Menu.findOneAndUpdate(
      { date, mealType },
      { $set: { items, setBy: req.user.userId } },
      { upsert: true, new: true },
    );

    await AuditLog.create({
      actorId:      req.user.userId,
      actorRole:    req.user.role,
      action:       'MENU_UPDATED',
      targetEntity: 'Menu',
      targetId:     updated._id,
      oldValue:     old?.toObject() ?? null,
      newValue:     updated.toObject(),
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const getMenuForDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const [menus, activeMealTypes] = await Promise.all([
      Menu.find({ date }).sort({ mealType: 1 }),
      getActiveMealTypesForDate(date),
    ]);

    const grouped = {};
    for (const m of menus) {
      grouped[m.mealType] = m.items;
    }

    res.json({ date, menus: grouped, mealTypes: activeMealTypes });
  } catch (err) {
    next(err);
  }
};

const getTomorrowMenu = async (req, res, next) => {
  req.params.date = getTomorrowDateString();
  return getMenuForDate(req, res, next);
};

module.exports = { setMenu, getMenuForDate, getTomorrowMenu };
