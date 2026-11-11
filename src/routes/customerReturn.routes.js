const express = require('express');
const CustomerReturnController = require('../controllers/customerReturn.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.CUSTOMERS_READ), CustomerReturnController.list);
router.post('/', requirePermission(PERMISSIONS.CUSTOMERS_CREATE), CustomerReturnController.create);
router.delete('/:id', requirePermission(PERMISSIONS.CUSTOMERS_DELETE), CustomerReturnController.delete);

module.exports = router;

