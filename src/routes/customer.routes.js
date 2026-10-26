const express = require('express');
const CustomerController = require('../controllers/customer.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');
const validate = require('../middlewares/validate');
const { createCustomerSchema, updateCustomerSchema } = require('../validators/customer.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.CUSTOMERS_READ), CustomerController.list);
router.get('/:id', requirePermission(PERMISSIONS.CUSTOMERS_READ), CustomerController.getOne);
router.post('/', requirePermission(PERMISSIONS.CUSTOMERS_CREATE), validate(createCustomerSchema), CustomerController.create);
router.put('/:id', requirePermission(PERMISSIONS.CUSTOMERS_UPDATE), validate(updateCustomerSchema), CustomerController.update);
router.delete('/:id', requirePermission(PERMISSIONS.CUSTOMERS_DELETE), CustomerController.delete);

module.exports = router;
