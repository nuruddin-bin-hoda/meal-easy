const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: mongoose.Schema.Types.ObjectId,
  actorRole: String,
  action: String,
  targetEntity: String,
  targetId: mongoose.Schema.Types.ObjectId,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
