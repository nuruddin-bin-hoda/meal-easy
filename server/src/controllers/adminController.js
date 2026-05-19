const { User, AuditLog } = require('../models');
const { sendPushToUser } = require('../utils/pushService');

const promoteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user || user.status === 'deleted') {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.role !== 'user' || user.status !== 'active') {
      return res.status(400).json({ message: 'User must be an active regular user to be promoted.' });
    }

    user.role = 'admin';
    await user.save();

    await AuditLog.create({
      actorId:      req.user.userId,
      actorRole:    req.user.role,
      action:       'USER_PROMOTED_TO_ADMIN',
      targetEntity: 'User',
      targetId:     user._id,
      newValue:     { role: 'admin' },
    });

    sendPushToUser(user._id, { title: 'Role Updated', body: 'Congratulations! You have been promoted to Admin.' }).catch(() => {});

    res.json({ message: 'User promoted to admin.', user, roleChanged: true });
  } catch (err) {
    next(err);
  }
};

const downgradeAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user || user.status === 'deleted') {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot downgrade a superadmin.' });
    }
    if (user.role !== 'admin') {
      return res.status(400).json({ message: 'User is not an admin.' });
    }

    user.role = 'user';
    await user.save();

    await AuditLog.create({
      actorId:      req.user.userId,
      actorRole:    req.user.role,
      action:       'ADMIN_DOWNGRADED_TO_USER',
      targetEntity: 'User',
      targetId:     user._id,
      newValue:     { role: 'user' },
    });

    sendPushToUser(user._id, { title: 'Role Updated', body: 'Your account has been changed from Admin to User.' }).catch(() => {});

    res.json({ message: 'Admin downgraded to user.', user, roleChanged: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { promoteUser, downgradeAdmin };
