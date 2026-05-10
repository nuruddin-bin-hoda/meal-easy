const mongoose = require('mongoose');
const { AuditLog, User, Chef } = require('../models');
const { generatePDF } = require('../utils/pdfGenerator');

const ADMIN_ROLES = ['admin', 'superadmin'];

/** Build filter + resolve actor names for a list of audit logs. */
const buildFilter = (role, userId, query) => {
  const { startDate, endDate, actorId, action } = query;
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

  return filter;
};

const enrichLogs = async (logs) => {
  const userActorIds = [];
  const chefActorIds = [];
  for (const l of logs) {
    if (!l.actorId) continue;
    if (l.actorRole === 'chef') chefActorIds.push(l.actorId);
    else userActorIds.push(l.actorId);
  }

  const [userDocs, chefDocs] = await Promise.all([
    userActorIds.length > 0 ? User.find({ _id: { $in: userActorIds } }).select('name') : [],
    chefActorIds.length > 0 ? Chef.find({ _id: { $in: chefActorIds } }).select('name') : [],
  ]);

  const nameMap = new Map([
    ...userDocs.map((u) => [u._id.toString(), u.name]),
    ...chefDocs.map((c) => [c._id.toString(), c.name]),
  ]);

  return logs.map((l) => ({
    ...l.toObject(),
    actorName: l.actorId ? (nameMap.get(l.actorId.toString()) ?? '—') : '—',
  }));
};

const getLogs = async (req, res) => {
  const { role, userId } = req.user;
  const { page = '1', limit = '20' } = req.query;

  const filter = buildFilter(role, userId, req.query);
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
    AuditLog.countDocuments(filter),
  ]);

  const enrichedLogs = await enrichLogs(logs);

  res.json({
    data: enrichedLogs,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
};

const exportAuditLogsPDF = async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const filter = buildFilter(req.user.role, req.user.userId, req.query);

  // Cap export at 500 rows to avoid excessive Puppeteer memory usage
  const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(500);
  const enrichedLogs = await enrichLogs(logs);

  const fmtTs = (ts) => ts
    ? new Date(ts).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const rows = enrichedLogs.map((l, i) => `
    <tr class="${i % 2 === 1 ? 'even' : ''}">
      <td>${esc(fmtTs(l.timestamp))}</td>
      <td>${esc(l.actorName)}</td>
      <td><span class="role role-${esc(l.actorRole)}">${esc(l.actorRole ?? '—')}</span></td>
      <td>${esc(l.action)}</td>
      <td>${esc(l.targetEntity ?? '—')}</td>
    </tr>`).join('');

  const dateRange = [req.query.startDate, req.query.endDate].filter(Boolean).join(' → ') || 'All dates';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Audit Logs Export</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans', Arial, sans-serif; font-size: 9.5pt; color: #212121; background: #fff; }
    .header {
      display: flex; align-items: flex-end; justify-content: space-between;
      border-bottom: 2.5px solid #2e7d32; padding-bottom: 10px; margin-bottom: 16px;
    }
    .app-name { font-size: 18pt; font-weight: 700; color: #2e7d32; }
    .title { font-size: 12pt; font-weight: 600; color: #555; }
    .meta { font-size: 8pt; color: #888; text-align: right; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #e8f5e9; color: #1b5e20; font-weight: 700; padding: 6px 8px; text-align: left; border: 1px solid #c8e6c9; font-size: 9pt; }
    td { padding: 4px 8px; border: 1px solid #e0e0e0; vertical-align: middle; }
    tr.even td { background: #fafafa; }
    .role { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 8pt; font-weight: 600; }
    .role-superadmin { background: #ffebee; color: #b71c1c; }
    .role-admin      { background: #fff8e1; color: #6d4c00; }
    .role-user       { background: #f5f5f5; color: #424242; }
    .role-chef       { background: #f3e5f5; color: #4a148c; }
    .footer { margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 8px; font-size: 8pt; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="app-name">Meal Easy</div>
      <div class="title">Audit Log Export</div>
    </div>
    <div class="meta">
      <div>Period: ${esc(dateRange)}</div>
      <div>Records: ${enrichedLogs.length}${enrichedLogs.length === 500 ? ' (capped)' : ''}</div>
      <div>Generated: ${new Date().toISOString()}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Actor</th>
        <th>Role</th>
        <th>Action</th>
        <th>Target</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Meal Easy — Audit Log Export — ${new Date().toISOString()}</div>
</body>
</html>`;

  const pdfBuffer = await generatePDF(html);

  const stamp = new Date().toISOString().slice(0, 10);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="audit-logs-${stamp}.pdf"`,
    'Content-Length': pdfBuffer.length,
  });
  res.send(pdfBuffer);
};

module.exports = { getLogs, exportAuditLogsPDF };
