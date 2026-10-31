const express = require('express');
const PurchaseController = require('../controllers/purchase.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');
const validate = require('../middlewares/validate');
const { createPurchaseSchema } = require('../validators/purchase.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.PURCHASES_READ), PurchaseController.list);
router.get('/:id', requirePermission(PERMISSIONS.PURCHASES_READ), PurchaseController.getOne);
router.post('/', requirePermission(PERMISSIONS.PURCHASES_CREATE), validate(createPurchaseSchema), PurchaseController.create);
router.put('/:id', requirePermission(PERMISSIONS.PURCHASES_UPDATE || PERMISSIONS.PURCHASES_CREATE), PurchaseController.update);
router.delete('/:id', requirePermission(PERMISSIONS.PURCHASES_DELETE || PERMISSIONS.PURCHASES_UPDATE), PurchaseController.delete);

module.exports = router;
