const NotificationService = require('../services/notification.service');
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
}

module.exports = NotificationController;

