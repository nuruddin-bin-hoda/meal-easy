const bcrypt = require('bcryptjs');
const { User, Chef, BillingCycle, AuditLog } = require('../models');
const { sendPushToUser } = require('../utils/pushService');

const currentBillingMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// GET /api/v1/users  — Admin/Superadmin
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { status: { $ne: 'deleted' } };
    if (req.query.status) filter.status = req.query.status;

    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/:id  — Admin or self
const getUser = async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role === 'user' && userId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user || user.status === 'deleted') {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/:id  — Self only
const updateUser = async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (userId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (role === 'chef') {
      const updates = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.file) updates.photo = req.file.filename;

      const chef = await Chef.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true },
      ).select('-loginPasswordHash');

      if (!chef) return res.status(404).json({ message: 'Chef not found.' });

      return res.json({ ...chef.toObject(), role: 'chef' });
    }

    const allowed = ['name', 'phone', 'roomNumber', 'language'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (req.file) updates.photo = req.file.filename;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Phone number already in use.' });
    }
    next(err);
  }
};

// DELETE /api/v1/users/:id  — Self only, soft delete
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.user;
    if (userId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const locked = await BillingCycle.findOne({
      billingMonth: currentBillingMonth(),
      isLocked: true,
    });
    if (locked) {
      return res.status(400).json({
        message: 'Cannot delete account during an active locked billing month',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted', deletedAt: new Date() },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    res.json({ message: 'Account deleted.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/:id/approve  — Admin/Superadmin
const approveUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true },
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    sendPushToUser(req.params.id, { title: 'Account Approved', body: 'Your Meal Easy account has been approved!' }).catch(() => {});

    res.json({ message: 'User approved.', user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/:id/reject  — Admin/Superadmin
const rejectUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true },
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    sendPushToUser(req.params.id, { title: 'Account Update', body: 'Your registration was not approved.' }).catch(() => {});

    res.json({ message: 'User rejected.', user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/:id/meal-block  — Admin/Superadmin
const toggleMealBlock = async (req, res, next) => {
  try {
    const { blocked } = req.body;
    if (typeof blocked !== 'boolean') {
      return res.status(422).json({ message: '`blocked` must be a boolean.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { mealBlocked: blocked },
      { new: true },
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    await AuditLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'USER_MEAL_BLOCK_TOGGLED',
      targetEntity: 'User',
      targetId: user._id,
      oldValue: { mealBlocked: !blocked },
      newValue: { mealBlocked: blocked },
    });

    res.json({ message: `Meal block ${blocked ? 'enabled' : 'disabled'}.`, user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/:id/password  — self only
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.params.id);
    if (!user || user.status === 'deleted') {
      return res.status(404).json({ message: 'User not found.' });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, getUser, updateUser, deleteUser, approveUser, rejectUser, toggleMealBlock, changePassword };
