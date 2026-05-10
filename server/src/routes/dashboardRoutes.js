const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { getAdminDashboard, getUserDashboard, getChefDashboard } = require('../controllers/dashboardController');

router.get('/dashboard/admin', authenticate, authorize(['admin', 'superadmin']), getAdminDashboard);
router.get('/dashboard/user', authenticate, authorize(['user', 'admin', 'superadmin']), getUserDashboard);
router.get('/dashboard/chef', authenticate, authorize(['chef']), getChefDashboard);

module.exports = router;
