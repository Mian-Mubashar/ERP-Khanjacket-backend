const { getMessaging, isFirebaseReady, isApnsReady } = require('../config/firebase');
const { DevicePushToken } = require('../models');
const logger = require('../utils/logger');

class PushNotificationService {
  /**
   * Register or update a device push token
   */
  static async registerDeviceToken({
    token,
    platform = 'android',
    userId = null,
    deviceId = null,
    deviceName = null,
    appVersion = null
  }) {
    if (!token || typeof token !== 'string') {
      throw new Error('Valid push registration token is required');
    }

    const cleanPlatform = ['android', 'ios', 'web'].includes(platform?.toLowerCase())
      ? platform.toLowerCase()
      : 'android';

    try {
      const existing = await DevicePushToken.findOne({ where: { token } });

      if (existing) {
        await existing.update({
          platform: cleanPlatform,
          userId: userId || existing.userId,
          deviceId: deviceId || existing.deviceId,
          deviceName: deviceName || existing.deviceName,
          appVersion: appVersion || existing.appVersion,
          isActive: true,
          lastActiveAt: new Date()
        });
        logger.info(`[PushNotification] Updated existing device token for platform: ${cleanPlatform}`);
        return existing;
      }

      const id = `TOKEN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const created = await DevicePushToken.create({
        id,
        token,
        platform: cleanPlatform,
        userId: userId || null,
        deviceId: deviceId || null,
        deviceName: deviceName || (cleanPlatform === 'ios' ? 'iPhone' : 'Android Device'),
        appVersion: appVersion || '1.0.0',
        isActive: true,
        lastActiveAt: new Date()
      });

      logger.info(`[PushNotification] Registered new device token ID: ${id} (${cleanPlatform})`);
      return created;
    } catch (error) {
      logger.error('[PushNotification] Failed to register token:', error.message);
      throw error;
    }
  }

  /**
   * Deactivate a device token (e.g. on logout or app uninstall)
   */
  static async unregisterDeviceToken(token) {
    if (!token) return false;
    try {
      const [updated] = await DevicePushToken.update(
        { isActive: false },
        { where: { token } }
      );
      return updated > 0;
    } catch (error) {
      logger.error('[PushNotification] Failed to unregister token:', error.message);
      return false;
    }
  }

  /**
   * Broadcast push notification to all active devices (Android + iOS)
   */
  static async broadcastPushNotification({
    title,
    body,
    data = {},
    urgency = 'normal'
  }) {
    if (!isFirebaseReady()) {
      logger.warn('[PushNotification] Cannot send push notification: Firebase is not initialized');
      return { success: false, reason: 'Firebase not configured in .env' };
    }

    try {
      const activeDevices = await DevicePushToken.findAll({
        where: { isActive: true },
        attributes: ['id', 'token', 'platform']
      });

      if (!activeDevices.length) {
        logger.info('[PushNotification] No active device tokens registered in database.');
        return { success: true, deliveredCount: 0, reason: 'No registered devices' };
      }

      const tokens = activeDevices.map(d => d.token);
      return await this._sendMulticast(tokens, { title, body, data, urgency });
    } catch (error) {
      logger.error('[PushNotification] Broadcast error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to a specific user's registered devices
   */
  static async sendToUser(userId, {
    title,
    body,
    data = {},
    urgency = 'normal'
  }) {
    if (!isFirebaseReady() || !userId) return { success: false };

    try {
      const userDevices = await DevicePushToken.findAll({
        where: { userId, isActive: true },
        attributes: ['id', 'token', 'platform']
      });

      if (!userDevices.length) {
        return { success: true, deliveredCount: 0, reason: 'User has no registered devices' };
      }

      const tokens = userDevices.map(d => d.token);
      return await this._sendMulticast(tokens, { title, body, data, urgency });
    } catch (error) {
      logger.error(`[PushNotification] Send to user ${userId} error:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Internal Multicast Sender with automatic dead token pruning
   */
  static async _sendMulticast(tokens, { title, body, data = {}, urgency = 'normal' }) {
    const messaging = getMessaging();
    if (!messaging) return { success: false, reason: 'Messaging not available' };

    // Format string-only data payload for Firebase compliance
    const stringData = {};
    for (const [k, v] of Object.entries(data)) {
      stringData[k] = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
    }

    // High priority for critical alerts (Wasooli, stock shortage)
    const isHighPriority = urgency === 'critical' || urgency === 'warning';

    const messagePayload = {
      notification: {
        title: title || 'Khan Jacket House Alert',
        body: body || 'New update in warehouse system'
      },
      data: {
        ...stringData,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: Date.now().toString()
      },
      // Android specific configuration
      android: {
        priority: isHighPriority ? 'high' : 'normal',
        notification: {
          channelId: 'khan_warehouse_alerts',
          sound: 'default',
          color: '#2563eb',
          icon: 'ic_notification',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      },
      // Apple iOS (APNs) specific payload
      apns: {
        payload: {
          aps: {
            alert: {
              title: title || 'Khan Jacket House',
              body: body || 'New warehouse alert'
            },
            badge: 1,
            sound: 'default',
            contentAvailable: true,
            category: 'WAREHOUSE_ALERT'
          }
        },
        headers: {
          'apns-priority': isHighPriority ? '10' : '5'
        }
      }
    };

    // Firebase multicast supports up to 500 tokens per batch
    const BATCH_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;
    const tokensToDeactivate = [];

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batchTokens = tokens.slice(i, i + BATCH_SIZE);
      const batchMessage = {
        ...messagePayload,
        tokens: batchTokens
      };

      try {
        const response = await messaging.sendEachForMulticast(batchMessage);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        // Clean up invalid or uninstalled tokens automatically
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token'
            ) {
              tokensToDeactivate.push(batchTokens[idx]);
            }
          }
        });
      } catch (batchError) {
        logger.error('[PushNotification] Batch send failed:', batchError.message);
      }
    }

    // Deactivate stale tokens in background
    if (tokensToDeactivate.length > 0) {
      DevicePushToken.update(
        { isActive: false },
        { where: { token: tokensToDeactivate } }
      ).catch(e => logger.error('[PushNotification] Error pruning stale tokens:', e.message));
    }

    logger.info(`[PushNotification] Sent multicast: ${totalSuccess} successful, ${totalFailure} failed.`);

    return {
      success: true,
      deliveredCount: totalSuccess,
      failedCount: totalFailure,
      stalePruned: tokensToDeactivate.length
    };
  }
}

module.exports = PushNotificationService;

