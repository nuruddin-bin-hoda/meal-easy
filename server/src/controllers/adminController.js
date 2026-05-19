const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require('../config/env');
const { sendPushToUser } = require('../utils/pushService');
const { invalidateUserCache } = require('../middleware/authenticate');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  get secure() { return NODE_ENV === 'production' && process.env.SECURE_COOKIES === 'true'; },
};

function signToken(userId, role, tokenVersion) {
  return jwt.sign({ userId, role, tokenVersion }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

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
    invalidateUserCache(user._id);

    // Issue a new JWT reflecting the updated role so the affected user's next
    // request is authorised immediately without requiring a manual re-login.
    const newToken = signToken(user._id, user.role, user.tokenVersion ?? 0);

    if (req.user.userId === user._id.toString()) {
      // Rare edge-case: acting on own account — update the caller's cookie.
      res.cookie('token', newToken, COOKIE_OPTS);
    }

    await AuditLog.create({
      actorId:      req.user.userId,
      actorRole:    req.user.role,
      action:       'USER_PROMOTED_TO_ADMIN',
      targetEntity: 'User',
      targetId:     user._id,
      newValue:     { role: 'admin' },
    });

    sendPushToUser(user._id, { title: 'Role Updated', body: 'Congratulations! You have been promoted to Admin.' }).catch(() => {});

    res.json({ message: 'User promoted to admin.', user, roleChanged: true, newToken });
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
    // Increment tokenVersion to immediately invalidate the ex-admin's existing JWT.
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
    invalidateUserCache(user._id);

    const newToken = signToken(user._id, user.role, user.tokenVersion);

    if (req.user.userId === user._id.toString()) {
      res.cookie('token', newToken, COOKIE_OPTS);
    }

    await AuditLog.create({
      actorId:      req.user.userId,
      actorRole:    req.user.role,
      action:       'ADMIN_DOWNGRADED_TO_USER',
      targetEntity: 'User',
      targetId:     user._id,
      newValue:     { role: 'user' },
    });

    sendPushToUser(user._id, { title: 'Role Updated', body: 'Your account has been changed from Admin to User.' }).catch(() => {});

    res.json({ message: 'Admin downgraded to user.', user, roleChanged: true, newToken });
  } catch (err) {
    next(err);
  }
};

module.exports = { promoteUser, downgradeAdmin };
