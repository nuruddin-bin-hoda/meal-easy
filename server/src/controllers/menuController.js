const { Menu, AuditLog } = require('../models');
const { getTomorrowDateString } = require('../utils/mealHelpers');

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
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'MENU_UPDATED',
      targetEntity: 'Menu',
      targetId: updated._id,
      oldValue: old?.toObject() ?? null,
      newValue: updated.toObject(),
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const getMenuForDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const menus = await Menu.find({ date }).sort({ mealType: 1 });

    const grouped = {};
    for (const m of menus) {
      grouped[m.mealType] = m.items;
    }

    res.json({ date, menus: grouped });
  } catch (err) {
    next(err);
  }
};

const getTomorrowMenu = async (req, res, next) => {
  req.params.date = getTomorrowDateString();
  return getMenuForDate(req, res, next);
};

module.exports = { setMenu, getMenuForDate, getTomorrowMenu };
