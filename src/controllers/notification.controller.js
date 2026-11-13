const NotificationService = require('../services/notification.service');
const PushNotificationService = require('../services/pushNotification.service');
const ApiResponse = require('../utils/apiResponse');

class NotificationController {
  static async list(req, res, next) {
    try {
      const result = await NotificationService.listNotifications(req.query);
      return ApiResponse.success(res, result, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async cleanup(req, res, next) {
    try {
      const days = req.body?.days || req.query?.days || 10;
      const result = await NotificationService.cleanupExpired(days);
      return ApiResponse.success(res, result, `Expired notifications older than ${days} days permanently deleted from database`);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAsRead(req.params.id);
      return ApiResponse.success(res, result, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead();
      return ApiResponse.success(res, result, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register mobile device push token (Android / iOS)
   */
  static async registerDeviceToken(req, res, next) {
    try {
      const { token, platform, deviceId, deviceName, appVersion } = req.body;
      const userId = req.user?.id || req.body?.userId || null;

      if (!token) {
        return ApiResponse.error(res, 'Push notification token is required', 400);
      }

      const record = await PushNotificationService.registerDeviceToken({
        token,
        platform,
        userId,
        deviceId,
        deviceName,
        appVersion
      });

      return ApiResponse.success(res, record, 'Device push token registered successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unregister device push token (e.g. on logout)
   */
  static async unregisterDeviceToken(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) {
        return ApiResponse.error(res, 'Push notification token is required', 400);
      }

      const success = await PushNotificationService.unregisterDeviceToken(token);
      return ApiResponse.success(res, { success }, 'Device push token unregistered successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send test push notification for verification
   */
  static async testPush(req, res, next) {
    try {
      const { title, body, urgency } = req.body;
      const result = await PushNotificationService.broadcastPushNotification({
        title: title || '🔔 Khan Warehouse Test Notification',
        body: body || 'Test push notification received successfully on mobile!',
        data: {
          test: 'true',
          sentAt: new Date().toISOString()
        },
        urgency: urgency || 'normal'
      });

      return ApiResponse.success(res, result, 'Test push notification dispatched');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;
