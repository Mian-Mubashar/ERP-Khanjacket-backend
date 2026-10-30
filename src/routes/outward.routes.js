const express = require('express');
const OutwardController = require('../controllers/outward.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');
const validate = require('../middlewares/validate');
const { createOutwardSchema } = require('../validators/outward.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.OUTWARD_READ), OutwardController.list);
router.post('/', requirePermission(PERMISSIONS.OUTWARD_CREATE), validate(createOutwardSchema), OutwardController.create);
router.put('/:id', requirePermission(PERMISSIONS.OUTWARD_UPDATE), OutwardController.update);
router.delete('/:id', requirePermission(PERMISSIONS.OUTWARD_DELETE), OutwardController.delete);

module.exports = router;
