const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/permissions');
const { authLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { loginSchema, registerSchema, switchRoleSchema, updateProfileSchema } = require('../validators/auth.validator');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/register', authenticate, requireRole(ROLES.ADMIN), validate(registerSchema), AuthController.register);
router.post('/switch-role', authenticate, validate(switchRoleSchema), AuthController.switchRole);
router.get('/me', authenticate, AuthController.getMe);
router.put('/profile', authenticate, validate(updateProfileSchema), AuthController.updateProfile);

module.exports = router;
