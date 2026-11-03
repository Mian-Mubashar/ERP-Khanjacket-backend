const express = require('express');
const AreaController = require('../controllers/area.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate);

router.get('/', AreaController.list);
router.post('/', requirePermission(PERMISSIONS.CITIES_MANAGE), AreaController.create);
router.delete('/:id', requirePermission(PERMISSIONS.CITIES_MANAGE), AreaController.delete);

module.exports = router;

