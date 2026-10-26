const express = require('express');
const AuditController = require('../controllers/audit.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.AUDIT_READ), AuditController.list);

module.exports = router;
