const express = require('express');
const StuffController = require('../controllers/stuff.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate);

// Fabrics / Stuffs
router.get('/', StuffController.list);
router.post('/', requirePermission(PERMISSIONS.STUFFS_MANAGE), StuffController.create);

// Categories
router.get('/categories', StuffController.listCategories);
router.post('/categories', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), StuffController.createCategory);
router.put('/categories/:name', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), StuffController.updateCategory);
router.delete('/categories/:name', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), StuffController.deleteCategory);

module.exports = router;
