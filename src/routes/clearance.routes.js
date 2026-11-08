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

module.exports = router;
