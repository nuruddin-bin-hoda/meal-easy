const mongoose = require('mongoose');
const { AuditLog } = require('../models');

const ADMIN_ROLES = ['admin', 'superadmin'];

const getLogs = async (req, res) => {
  const { role, userId } = req.user;
  const { startDate, endDate, actorId, action, page = '1', limit = '20' } = req.query;

  const filter = {};

  if (ADMIN_ROLES.includes(role)) {
    if (actorId) filter.actorId = new mongoose.Types.ObjectId(actorId);
    if (action) filter.action = action;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        filter.timestamp.$lt = end;
      }
    }
  } else {
    filter.actorId = new mongoose.Types.ObjectId(userId);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    data: logs,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
};

module.exports = { getLogs };
