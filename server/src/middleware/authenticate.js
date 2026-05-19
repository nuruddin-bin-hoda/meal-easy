const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require('../config/env');
const User = require('../models/User');

const ROLE_RANK = { user: 1, chef: 2, admin: 3, superadmin: 4 };

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  get secure() { return NODE_ENV === 'production' && process.env.SECURE_COOKIES === 'true'; },
};

// 60-second in-memory cache: userId (string) → { version, role, expiresAt }
const tvCache = new Map();

async function getUserRecord(userId) {
  const now = Date.now();
  const cached = tvCache.get(userId);
  if (cached && cached.expiresAt > now) return cached;

  const user = await User.findById(userId).select('tokenVersion role').lean();
  const record = {
    version:   user?.tokenVersion ?? 0,
    role:      user?.role ?? null,
    expiresAt: now + 60_000,
  };
  tvCache.set(userId, record);
  return record;
}

const authenticate = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Unauthorised' });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Unauthorised' });
  }

  // Chefs have no tokenVersion or role-change path — skip DB check entirely.
  if (decoded.role !== 'chef') {
    try {
      const record = await getUserRecord(decoded.userId);

      // Token has been invalidated (e.g. demotion incremented tokenVersion).
      if (record.version > (decoded.tokenVersion ?? 0)) {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }

      if (record.role && record.role !== decoded.role) {
        const dbRank  = ROLE_RANK[record.role]  ?? 0;
        const jwtRank = ROLE_RANK[decoded.role] ?? 0;

        if (dbRank > jwtRank) {
          // Promotion — silently reissue JWT with the updated role and continue.
          const newToken = jwt.sign(
            { userId: decoded.userId, role: record.role, tokenVersion: record.version },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN },
          );
          res.cookie('token', newToken, COOKIE_OPTS);
          decoded.role = record.role;
        } else {
          // Demotion — force re-login.
          return res.status(401).json({
            error:   'SESSION_STALE',
            message: 'Your account role has changed. Please log in again.',
          });
        }
      }
    } catch {
      return res.status(401).json({ message: 'Unauthorised' });
    }
  }

  req.user = { userId: decoded.userId, role: decoded.role };
  next();
};

function invalidateUserCache(userId) {
  tvCache.delete(userId.toString());
}

// Attach so callers can import as: const { invalidateUserCache } = require('./authenticate')
// without breaking existing: const authenticate = require('./authenticate')
authenticate.invalidateUserCache = invalidateUserCache;

module.exports = authenticate;
