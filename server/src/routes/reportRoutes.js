const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { getReportData } = require('../controllers/reportController');

router.get('/reports/:userId/:month', authenticate, getReportData);

module.exports = router;
