const express = require('express');
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// All notification routes are protected
router.use(authenticate);

// List active notifications (last 10 days)
router.get('/', NotificationController.list);

// Manually trigger 10-day retention cleanup query
router.post('/cleanup', NotificationController.cleanup);

// Mark individual notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', NotificationController.markAllAsRead);

module.exports = router;
