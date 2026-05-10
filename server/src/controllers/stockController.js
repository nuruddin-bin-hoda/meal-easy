const { Stock, AuditLog } = require('../models');

const listStock = async (req, res, next) => {
  try {
    const items = await Stock.find({ isArchived: false }).sort({ itemName: 1 });
    const result = items.map(item => ({
      ...item.toObject(),
      isLow: item.quantity <= item.lowThreshold,
    }));
    res.json({ stock: result });
  } catch (err) {
    next(err);
  }
};

const createStock = async (req, res, next) => {
  try {
    const { itemName, quantity, unit, lowThreshold } = req.body;
    const stockItem = await Stock.create({ itemName, quantity, unit, lowThreshold });
    res.status(201).json({ stockItem });
  } catch (err) {
    next(err);
  }
};

const updateStockQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    const existing = await Stock.findOne({ _id: req.params.id, isArchived: false });
    if (!existing) return res.status(404).json({ message: 'Stock item not found.' });

    const oldQuantity = existing.quantity;

    existing.quantity = quantity;
    existing.updatedBy = req.user.userId;
    await existing.save();

    await AuditLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'STOCK_UPDATED',
      targetEntity: 'Stock',
      targetId: existing._id,
      oldValue: { quantity: oldQuantity },
      newValue: { quantity },
    });

    res.json({ stockItem: { ...existing.toObject(), isLow: existing.quantity <= existing.lowThreshold } });
  } catch (err) {
    next(err);
  }
};

const updateStockSettings = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.itemName !== undefined) updates.itemName = req.body.itemName;
    if (req.body.lowThreshold !== undefined) updates.lowThreshold = req.body.lowThreshold;

    const stockItem = await Stock.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      updates,
      { new: true, runValidators: true },
    );
    if (!stockItem) return res.status(404).json({ message: 'Stock item not found.' });

    res.json({ stockItem: { ...stockItem.toObject(), isLow: stockItem.quantity <= stockItem.lowThreshold } });
  } catch (err) {
    next(err);
  }
};

const archiveStock = async (req, res, next) => {
  try {
    const stockItem = await Stock.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      { isArchived: true },
      { new: true },
    );
    if (!stockItem) return res.status(404).json({ message: 'Stock item not found.' });

    res.json({ message: 'Stock item archived.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listStock, createStock, updateStockQuantity, updateStockSettings, archiveStock };
