const express = require('express');
const ClearanceController = require('../controllers/clearance.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', ClearanceController.create);
router.get('/', ClearanceController.list);
router.get('/:id', ClearanceController.getOne);
router.put('/:id', ClearanceController.update);
router.delete('/:id', ClearanceController.delete);

// Payment endpoints (Khata Adaigi)
router.post('/:id/payments', ClearanceController.recordPayment);
router.get('/:id/payments', ClearanceController.getPayments);
router.delete('/payments/:paymentId', ClearanceController.deletePayment);

module.exports = router;

