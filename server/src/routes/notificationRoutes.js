const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { subscribe, getNotifications, markRead } = require('../controllers/notificationController');

router.post('/notifications/subscribe', authenticate, subscribe);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markRead);

module.exports = router;
