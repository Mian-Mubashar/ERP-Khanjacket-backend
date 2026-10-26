const express = require('express');
const LocationController = require('../controllers/location.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', LocationController.list);
router.post('/', LocationController.create);
router.delete('/:name', LocationController.delete);

module.exports = router;
