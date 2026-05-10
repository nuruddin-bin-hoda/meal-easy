const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { getReportData, downloadReportPDF } = require('../controllers/reportController');

router.get('/reports/:userId/:month', authenticate, getReportData);
router.get('/reports/:userId/:month/pdf', authenticate, downloadReportPDF);

module.exports = router;
