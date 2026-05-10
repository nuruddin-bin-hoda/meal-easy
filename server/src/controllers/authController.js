const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Chef } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require('../config/env');
const { sendPushToAdmins } = require('../utils/pushService');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  get secure() { return NODE_ENV === 'production'; },
};

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { name, phone, roomNumber, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const photo = req.file ? req.file.filename : undefined;

    await User.create({
      name,
      phone,
      roomNumber,
      passwordHash,
      photo,
      status: 'pending',
      role: 'user',
    });

    sendPushToAdmins({ title: 'New Registration', body: `${name} has requested to join.` }).catch(() => {});

    res.status(201).json({ message: 'Registration submitted. Awaiting approval.' });
  } catch (err) {
    // Duplicate phone
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Phone number already registered.' });
    }
    next(err);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // Try User first
    let actor = await User.findOne({ phone });
    let isChef = false;

    if (!actor) {
      // Fall back to Chef (chefs have loginUsername stored, but spec says phone login)
      actor = await Chef.findOne({ phone });
      isChef = true;
    }

    if (!actor) return res.status(401).json({ message: 'Invalid credentials.' });

    if (isChef) {
      if (!actor.isActive) return res.status(403).json({ message: 'Account is inactive.' });
      const match = await bcrypt.compare(password, actor.loginPasswordHash);
      if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

      const token = signToken(actor._id, 'chef');
      res.cookie('token', token, COOKIE_OPTS);
      return res.json({ user: { _id: actor._id, name: actor.name, role: 'chef' } });
    }

    // User path
    if (actor.status !== 'active') {
      const msg =
        actor.status === 'pending' ? 'Account pending approval.' :
        actor.status === 'blocked' ? 'Account is blocked.' :
        'Account unavailable.';
      return res.status(403).json({ message: msg });
    }

    const match = await bcrypt.compare(password, actor.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = signToken(actor._id, actor.role);
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ user: { _id: actor._id, name: actor.name, role: actor.role, language: actor.language } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/logout
const logout = (_req, res) => {
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ message: 'Logged out' });
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const { userId, role } = req.user;

    if (role === 'chef') {
      const chef = await Chef.findById(userId).select('-loginPasswordHash');
      if (!chef) return res.status(404).json({ message: 'Chef not found.' });
      return res.json(chef);
    }

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe };
