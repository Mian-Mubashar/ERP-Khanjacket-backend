/**
 * Production Firebase Admin & Apple APNs Initialization
 * All secrets and keys are strictly loaded from environment variables via src/config/env.js (never hardcoded).
 */
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const config = require('./env');
const logger = require('../utils/logger');

let firebaseApp = null;
let messagingInstance = null;
let isFirebaseReady = false;
let isApnsReady = false;

function initFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    const pushConfig = config.pushNotifications || {};
    let credential = null;

    // 1. Check for Service Account file path in .env
    const serviceAccountPath = pushConfig.firebaseServiceAccountPath;
    if (serviceAccountPath) {
      const resolvedPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.resolve(__dirname, '../../', serviceAccountPath);

      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const serviceAccountJson = JSON.parse(fileContent);
        credential = admin.cert(serviceAccountJson);
        logger.info(`[Firebase] Loaded credentials from file: ${serviceAccountPath}`);
      }
    }

    // 2. Fallback to inline environment variables
    if (!credential && pushConfig.firebaseProjectId && pushConfig.firebaseClientEmail && pushConfig.firebasePrivateKey) {
      credential = admin.cert({
        projectId: pushConfig.firebaseProjectId,
        clientEmail: pushConfig.firebaseClientEmail,
        privateKey: pushConfig.firebasePrivateKey.replace(/\\n/g, '\n')
      });
      logger.info(`[Firebase] Loaded credentials from inline environment variables`);
    }

    if (credential) {
      firebaseApp = admin.initializeApp({
        credential,
        projectId: pushConfig.firebaseProjectId || undefined
      });
      messagingInstance = getMessaging(firebaseApp);
      isFirebaseReady = true;
      logger.info(`[Firebase] Initialized successfully for project: ${firebaseApp.options.projectId || 'khan-warehouse-app'}`);
    } else {
      logger.warn('[Firebase] No valid credentials found in .env (FIREBASE_SERVICE_ACCOUNT_PATH or inline keys). Push notifications disabled.');
    }

    // 3. Apple APNs Provider Verification (Prepared for Apple Developer Account)
    const apns = pushConfig.appleApns || {};
    if (apns.enabled && apns.keyId && apns.teamId) {
      isApnsReady = true;
      logger.info(`[Apple APNs] Configured for Key ID: ${apns.keyId}, Team ID: ${apns.teamId}`);
    } else {
      logger.info('[Apple APNs] Waiting for Apple Developer credentials in .env. FCM payload prepared with APNs structure.');
    }

    return firebaseApp;
  } catch (error) {
    logger.error('[Firebase] Initialization error:', error.message);
    isFirebaseReady = false;
    return null;
  }
}

// Initialize on module load
initFirebase();

module.exports = {
  admin,
  getFirebaseApp: () => firebaseApp,
  getMessaging: () => messagingInstance,
  isFirebaseReady: () => isFirebaseReady,
  isApnsReady: () => isApnsReady
};
