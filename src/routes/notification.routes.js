const express = require('express');
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Device token registration (Can be called with or without auth so device can register on app launch)
router.post('/register-device', NotificationController.registerDeviceToken);
router.post('/unregister-device', NotificationController.unregisterDeviceToken);

// All other notification routes are protected
router.use(authenticate);

// List active notifications (last 10 days)
router.get('/', NotificationController.list);

// Manually trigger 10-day retention cleanup query
router.post('/cleanup', NotificationController.cleanup);

// Mark individual notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', NotificationController.markAllAsRead);

// Test Push Notification Dispatch
router.post('/test-push', NotificationController.testPush);

module.exports = router;
