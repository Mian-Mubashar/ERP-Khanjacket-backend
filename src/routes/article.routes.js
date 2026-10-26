const express = require('express');
const ArticleController = require('../controllers/article.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { PERMISSIONS } = require('../constants/permissions');
const validate = require('../middlewares/validate');
const { createArticleSchema, updateArticleSchema } = require('../validators/article.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.ARTICLES_READ), ArticleController.list);
router.get('/:articleNo', requirePermission(PERMISSIONS.ARTICLES_READ), ArticleController.getOne);
router.post('/', requirePermission(PERMISSIONS.ARTICLES_CREATE), validate(createArticleSchema), ArticleController.create);
router.put('/:articleNo', requirePermission(PERMISSIONS.ARTICLES_UPDATE), validate(updateArticleSchema), ArticleController.update);
router.delete('/:articleNo', requirePermission(PERMISSIONS.ARTICLES_DELETE), ArticleController.delete);

module.exports = router;
