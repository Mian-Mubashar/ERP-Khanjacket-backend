const { Op } = require('sequelize');
const { Notification } = require('../models');
const NotificationCleanupService = require('./notificationCleanup.service');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Create an announcement / notification event
   */
  static async createNotification({
    type = 'SYSTEM',
    title,
    message = '',
    category = 'General',
    referenceId = null,
    city = '',
    customerName = '',
    amount = 0,
    urgency = 'normal',
    metadata = null
  }) {
    try {
      const id = `NOTIF-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
      
      const notif = await Notification.create({
        id,
        type,
        title,
        message,
        category,
        referenceId,
        city,
        customerName,
        amount: Number(amount) || 0,
        urgency,
        metadata: metadata ? (typeof metadata === 'object' ? JSON.stringify(metadata) : metadata) : null
      });

      return notif;
    } catch (error) {
      logger.error('[NotificationService] Failed to create notification:', error.message);
      return null;
    }
  }

  /**
   * List announcements / notifications with structured 10-day active retention
   */
  static async listNotifications({
    page = 1,
    limit = 50,
    type = null,
    city = null,
    isRead = null,
    search = null,
    days = 10
  } = {}) {
    try {
      const where = {};
      const retentionDays = Number(days) || 10;

      // 1. Enforce 10-Day Retention Window (Items strictly within last 10 days)
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      where.createdAt = {
        [Op.gte]: cutoffDate
      };

      if (type && type !== 'ALL') {
        where.type = type;
      }

      if (city && city !== 'ALL') {
        where.city = city;
      }

      if (isRead !== null && isRead !== undefined) {
        where.isRead = isRead === 'true' || isRead === true;
      }

      if (search && search.trim()) {
        const q = search.trim();
        where[Op.or] = [
          { title: { [Op.like]: `%${q}%` } },
          { message: { [Op.like]: `%${q}%` } },
          { referenceId: { [Op.like]: `%${q}%` } },
          { customerName: { [Op.like]: `%${q}%` } },
          { city: { [Op.like]: `%${q}%` } }
        ];
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Notification.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset: Number(offset)
      });

      return {
        total: count,
        page: Number(page),
        limit: Number(limit),
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        notifications: rows
      };
    } catch (error) {
      logger.error('[NotificationService] Failed to list notifications:', error.message);
      return { total: 0, notifications: [], error: error.message };
    }
  }

  /**
   * Manually trigger the 10-day permanent deletion query
   */
  static async cleanupExpired(days = 10) {
    return await NotificationCleanupService.cleanupExpiredNotifications(days);
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(id) {
    const notif = await Notification.findByPk(id);
    if (notif) {
      await notif.update({ isRead: true });
      return notif;
    }
    return null;
  }

  /**
   * Mark all active notifications as read
   */
  static async markAllAsRead() {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      { where: { isRead: false } }
    );
    return { success: true, updatedCount };
  }
}

module.exports = NotificationService;

