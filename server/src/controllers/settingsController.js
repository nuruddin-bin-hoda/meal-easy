const { MessSettings, AuditLog } = require('../models');

const getSettings = async (req, res, next) => {
  try {
    const settings = await MessSettings.findOneAndUpdate(
      {},
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const allowed = ['timezone', 'cutoffReminderMinutes', 'guestMealMonthlyLimit', 'lowBalanceThreshold', 'mealTypes'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    update.updatedBy = req.user.userId;

    const old = await MessSettings.findOneAndUpdate(
      {},
      {},
      { upsert: true, new: false, setDefaultsOnInsert: true },
    );

    const updated = await MessSettings.findOneAndUpdate(
      {},
      { $set: update },
      { new: true },
    );

    await AuditLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'SETTINGS_UPDATED',
      targetEntity: 'MessSettings',
      targetId: updated._id,
      oldValue: old?.toObject() ?? null,
      newValue: updated.toObject(),
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings };
