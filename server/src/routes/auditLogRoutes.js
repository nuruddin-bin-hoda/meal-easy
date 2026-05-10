const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { getLogs, exportAuditLogsPDF } = require('../controllers/auditLogController');

router.get('/audit-logs', authenticate, getLogs);
router.get('/audit-logs/export', authenticate, exportAuditLogsPDF);

module.exports = router;
