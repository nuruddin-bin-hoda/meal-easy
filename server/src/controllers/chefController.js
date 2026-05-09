const bcrypt = require('bcryptjs');
const { Chef, ChefSalary, ChefBonus, AuditLog } = require('../models');

const createChef = async (req, res, next) => {
  try {
    const { name, phone, joinDate, salaryAmount, loginUsername, loginPassword } = req.body;

    const exists = await Chef.findOne({ loginUsername });
    if (exists) {
      return res.status(409).json({ message: 'Username already taken.' });
    }

    const loginPasswordHash = await bcrypt.hash(loginPassword, 10);
    const photo = req.file ? req.file.filename : undefined;

    const chef = await Chef.create({
      name,
      phone,
      joinDate,
      salaryAmount,
      loginUsername,
      loginPasswordHash,
      photo,
      createdBy: req.user.userId,
    });

    const chefObj = chef.toObject();
    delete chefObj.loginPasswordHash;

    res.status(201).json({ chef: chefObj });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Username already taken.' });
    next(err);
  }
};

const listChefs = async (req, res, next) => {
  try {
    const chefs = await Chef.find({ isActive: true }).select('-loginPasswordHash').sort({ createdAt: -1 });
    res.json({ chefs });
  } catch (err) {
    next(err);
  }
};

const getChef = async (req, res, next) => {
  try {
    const chef = await Chef.findById(req.params.id).select('-loginPasswordHash');
    if (!chef) return res.status(404).json({ message: 'Chef not found.' });
    res.json(chef);
  } catch (err) {
    next(err);
  }
};

const updateChef = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'joinDate', 'salaryAmount', 'isActive'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (req.file) update.photo = req.file.filename;

    const chef = await Chef.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select('-loginPasswordHash');
    if (!chef) return res.status(404).json({ message: 'Chef not found.' });

    res.json(chef);
  } catch (err) {
    next(err);
  }
};

const recordSalary = async (req, res, next) => {
  try {
    const { billingMonth, salaryAmount, paidStatus } = req.body;
    const chefId = req.params.id;

    const setFields = { chefId, billingMonth, salaryAmount, paidStatus };
    if (paidStatus === 'paid') setFields.paidAt = new Date();

    const old = await ChefSalary.findOne({ chefId, billingMonth });

    const salary = await ChefSalary.findOneAndUpdate(
      { chefId, billingMonth },
      { $set: setFields },
      { upsert: true, new: true },
    );

    await AuditLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'CHEF_SALARY_RECORDED',
      targetEntity: 'ChefSalary',
      targetId: salary._id,
      oldValue: old?.toObject() ?? null,
      newValue: salary.toObject(),
    });

    res.json(salary);
  } catch (err) {
    next(err);
  }
};

const addBonus = async (req, res, next) => {
  try {
    const { amount, date, reason } = req.body;
    const chefId = req.params.id;

    const bonus = await ChefBonus.create({
      chefId,
      amount,
      date,
      reason,
      recordedBy: req.user.userId,
    });

    await AuditLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'CHEF_BONUS_ADDED',
      targetEntity: 'ChefBonus',
      targetId: bonus._id,
      oldValue: null,
      newValue: bonus.toObject(),
    });

    res.status(201).json(bonus);
  } catch (err) {
    next(err);
  }
};

const getSalaryHistory = async (req, res, next) => {
  try {
    const chefId = req.params.id;

    const [salaries, bonuses] = await Promise.all([
      ChefSalary.find({ chefId }).sort({ billingMonth: -1 }),
      ChefBonus.find({ chefId }).sort({ date: -1 }),
    ]);

    res.json({ salaries, bonuses });
  } catch (err) {
    next(err);
  }
};

module.exports = { createChef, listChefs, getChef, updateChef, recordSalary, addBonus, getSalaryHistory };
