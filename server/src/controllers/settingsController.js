const { MessSettings, AuditLog } = require('../models');

function toClientSettings(doc) {
  const plain = doc.toObject();
  plain.mealTypes = (plain.mealTypes ?? []).filter((mt) => !mt.deletedAt);
  return plain;
}

const getSettings = async (req, res, next) => {
  try {
    const settings = await MessSettings.findOneAndUpdate(
      {},
      { $setOnInsert: { mealTypes: [], timezone: null } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json(toClientSettings(settings));
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      'timezone', 'cutoffReminderMinutes', 'guestMealMonthlyLimit', 'lowBalanceThreshold',
      'lowBalanceAlertsEnabled', 'menuUpdateAlertsEnabled', 'monthlyReportAlertsEnabled',
      // mealTypes is excluded — handled separately below
    ];
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

    if (req.body.mealTypes !== undefined) {
      const now = new Date();
      const stored = old?.mealTypes ?? [];
      const incoming = req.body.mealTypes; // frontend only ever sends non-deleted entries
      const incomingNames = new Set(incoming.map((mt) => mt.name));
      const storedNames   = new Set(stored.map((mt) => mt.name));

      update.mealTypes = [
        // Existing stored entries: update, soft-delete if absent, or leave deleted ones alone
        ...stored.map((mt) => {
          const obj = mt.toObject ? mt.toObject() : { ...mt };
          if (obj.deletedAt) return obj;                              // already soft-deleted
          if (incomingNames.has(obj.name)) {
            const inc = incoming.find((i) => i.name === obj.name);
            return { ...obj, ...inc, createdAt: obj.createdAt };      // update, preserve createdAt
          }
          return { ...obj, deletedAt: now, isActive: false };         // missing → soft-delete
        }),
        // Net-new entries (name not in any stored record)
        ...incoming
          .filter((mt) => !storedNames.has(mt.name))
          .map((mt) => ({ ...mt, createdAt: now, deletedAt: null })),
      ];
    }

    const updated = await MessSettings.findOneAndUpdate(
      {},
      { $set: update },
      { new: true },
    );

    await AuditLog.create({
      actorId:      req.user.userId,
      actorRole:    req.user.role,
      action:       'SETTINGS_UPDATED',
      targetEntity: 'MessSettings',
      targetId:     updated._id,
      oldValue:     old?.toObject() ?? null,
      newValue:     updated.toObject(),
    });

    res.json(toClientSettings(updated));
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings };
