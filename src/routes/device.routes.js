const express = require('express');
const DeviceController = require('../controllers/device.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');
const validate = require('../middlewares/validate');
const { createDeviceSchema } = require('../validators/device.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.DEVICES_READ), DeviceController.list);
router.post('/', requirePermission(PERMISSIONS.DEVICES_CREATE), validate(createDeviceSchema), DeviceController.create);
router.patch('/:id/toggle', requirePermission(PERMISSIONS.DEVICES_TOGGLE), DeviceController.toggle);
router.delete('/:id', requirePermission(PERMISSIONS.DEVICES_DELETE), DeviceController.delete);

module.exports = router;
