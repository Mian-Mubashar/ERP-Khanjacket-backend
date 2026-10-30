const express = require('express');
const PaymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');
const validate = require('../middlewares/validate');
const { supplierPaymentSchema, customerPaymentSchema } = require('../validators/payment.validator');

const router = express.Router();

router.use(authenticate);

// Supplier payments
router.get('/supplier', requirePermission(PERMISSIONS.SUPPLIER_PAYMENTS_READ), PaymentController.listSupplierPayments);
router.post('/supplier', requirePermission(PERMISSIONS.SUPPLIER_PAYMENTS_CREATE), validate(supplierPaymentSchema), PaymentController.recordSupplierPayment);
router.put('/supplier/:id', requirePermission(PERMISSIONS.SUPPLIERS_UPDATE), PaymentController.updateSupplierPayment);
router.delete('/supplier/:id', requirePermission(PERMISSIONS.SUPPLIERS_DELETE), PaymentController.deleteSupplierPayment);

// Customer payments
router.get('/customer', requirePermission(PERMISSIONS.CUSTOMER_PAYMENTS_READ), PaymentController.listCustomerPayments);
router.post('/customer', requirePermission(PERMISSIONS.CUSTOMER_PAYMENTS_CREATE), validate(customerPaymentSchema), PaymentController.recordCustomerPayment);
router.put('/customer/:id', requirePermission(PERMISSIONS.CUSTOMERS_UPDATE), PaymentController.updateCustomerPayment);
router.delete('/customer/:id', requirePermission(PERMISSIONS.CUSTOMERS_DELETE), PaymentController.deleteCustomerPayment);

module.exports = router;
