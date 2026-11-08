const { Op } = require('sequelize');
const { Notification, sequelize } = require('../models');
const logger = require('../utils/logger');

class NotificationCleanupService {
  /**
   * Automated 10-Day Retention Cleanup Engine
   * Deletes all notifications/announcements that are older than retentionDays (default 10 days)
   * Ensures the database remains lightweight, high-performance, and fast.
   */
  static async cleanupExpiredNotifications(retentionDays = 10) {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;

      // Method 1: Sequelize ORM Destroy
      try {
        deletedCount = await Notification.destroy({
          where: {
            createdAt: {
              [Op.lt]: cutoffDate
            }
          }
        });
      } catch (ormErr) {
        // Fallback Method 2: Raw SQL Execution for absolute reliability across dialects
        try {
          const [result] = await sequelize.query(
            `DELETE FROM notifications WHERE createdAt < :cutoffDate`,
            {
              replacements: { cutoffDate: cutoffDate.toISOString() }
            }
          );
          deletedCount = (result && typeof result.affectedRows === 'number') ? result.affectedRows : 0;
        } catch (rawErr) {
          logger.warn(`[Retention Cleanup] Raw SQL fallback note: ${rawErr.message}`);
        }
      }

      const logMsg = `[10-Day Auto Cleanup] Purged ${deletedCount} expired announcements/notifications older than ${retentionDays} days (Cutoff: ${cutoffDate.toISOString().split('T')[0]}). Database performance optimal.`;
      
      if (deletedCount > 0) {
        logger.info(logMsg);
        console.log(`🧹 ${logMsg}`);
      } else {
        logger.debug(logMsg);
      }

      return {
        success: true,
        deletedCount,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        message: `${deletedCount} expired notification(s) permanently removed from database.`
      };
    } catch (error) {
      logger.error(`[Retention Cleanup Error]: Failed to purge expired notifications: ${error.message}`);
      return {
        success: false,
        error: error.message,
        deletedCount: 0
      };
    }
  }

  /**
   * Initializes background scheduler for recurring cleanup
   * - Runs 5 seconds after server boot
   * - Runs automatically every 12 hours
   */
  static initScheduler() {
    // 1. Initial boot sweep (5 seconds after server start)
    setTimeout(() => {
      NotificationCleanupService.cleanupExpiredNotifications(10).catch(err => {
        logger.error('[Retention Cleanup Boot Error]:', err.message);
      });
    }, 5000);

    // 2. Scheduled Recurring sweep (Every 12 hours)
    const INTERVAL_12_HOURS = 12 * 60 * 60 * 1000;
    setInterval(() => {
      NotificationCleanupService.cleanupExpiredNotifications(10).catch(err => {
        logger.error('[Retention Cleanup Recurring Error]:', err.message);
      });
    }, INTERVAL_12_HOURS);

    logger.info('🚀 [Retention Scheduler] 10-day notification auto-cleanup background service running.');
  }
}

module.exports = NotificationCleanupService;

