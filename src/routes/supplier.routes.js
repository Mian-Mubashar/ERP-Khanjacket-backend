const express = require('express');
const SupplierController = require('../controllers/supplier.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');
const validate = require('../middlewares/validate');
const { createSupplierSchema, updateSupplierSchema } = require('../validators/supplier.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.SUPPLIERS_READ), SupplierController.list);
router.get('/:id', requirePermission(PERMISSIONS.SUPPLIERS_READ), SupplierController.getOne);
router.post('/', requirePermission(PERMISSIONS.SUPPLIERS_CREATE), validate(createSupplierSchema), SupplierController.create);
router.put('/:id', requirePermission(PERMISSIONS.SUPPLIERS_UPDATE || PERMISSIONS.SUPPLIERS_CREATE), validate(updateSupplierSchema), SupplierController.update);

module.exports = router;
