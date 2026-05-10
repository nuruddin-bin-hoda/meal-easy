const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { getLogs } = require('../controllers/auditLogController');

router.get('/audit-logs', authenticate, getLogs);

module.exports = router;
