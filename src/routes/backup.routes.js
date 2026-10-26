const express = require('express');
const BackupController = require('../controllers/backup.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate);

router.get('/export', requirePermission(PERMISSIONS.BACKUP_EXPORT), BackupController.exportBackup);

module.exports = router;
