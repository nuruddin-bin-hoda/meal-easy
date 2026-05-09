const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const authenticate = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Unauthorised' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorised' });
  }
};

module.exports = authenticate;
