const express = require('express');
const authRoutes = require('./auth.routes');
const articleRoutes = require('./article.routes');
const purchaseRoutes = require('./purchase.routes');
const outwardRoutes = require('./outward.routes');
const supplierRoutes = require('./supplier.routes');
const customerRoutes = require('./customer.routes');
const paymentRoutes = require('./payment.routes');
const cityRoutes = require('./city.routes');
const stuffRoutes = require('./stuff.routes');
const locationRoutes = require('./location.routes');
const deviceRoutes = require('./device.routes');
const auditRoutes = require('./audit.routes');
const reportRoutes = require('./report.routes');
const backupRoutes = require('./backup.routes');
const config = require('../config/env');

const router = express.Router();

// System Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Khan Clothes Warehouse API is online and healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: config.db.dialect
  });
});

// Mount Resource Routes
router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/outward', outwardRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/payments', paymentRoutes);
router.use('/cities', cityRoutes);
router.use('/stuffs', stuffRoutes);
router.use('/locations', locationRoutes);
router.use('/devices', deviceRoutes);
router.use('/audit', auditRoutes);
router.use('/reports', reportRoutes);
router.use('/backup', backupRoutes);

module.exports = router;
