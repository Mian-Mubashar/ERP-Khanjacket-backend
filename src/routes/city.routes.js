const express = require('express');
const CityController = require('../controllers/city.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate);

router.get('/', CityController.list);
router.post('/', requirePermission(PERMISSIONS.CITIES_MANAGE), CityController.create);
router.put('/:id', requirePermission(PERMISSIONS.CITIES_MANAGE), CityController.update);
router.delete('/:id', requirePermission(PERMISSIONS.CITIES_MANAGE), CityController.delete);

module.exports = router;
