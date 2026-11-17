const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const { User, Role, Permission } = require('../models');

/**
 * Authentication Middleware: Verifies JWT token and attaches user with role & permissions
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('No authentication token provided or invalid format. Please login.'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token has expired. Please log in again.'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }

    // Fetch user with role and permissions
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              model: Permission,
              as: 'permissions',
              attributes: ['name']
            }
          ]
        }
      ]
    });

    if (!user) {
      return next(ApiError.unauthorized('The user belonging to this token no longer exists.'));
    }

    if (user.status !== 'Active') {
      return next(ApiError.forbidden('Your account has been suspended. Please contact administrator.'));
    }

    const isOriginalAdmin = user.email.toLowerCase() === config.defaultAdmin.email.toLowerCase() || user.role?.name === 'Admin';
    let effectiveRoleName = user.role?.name || 'Viewer';
    let permissionNames = user.role?.permissions?.map(p => p.name) || [];

    // If original admin is previewing another role (Staff or Viewer) via active token
    if (isOriginalAdmin && decoded.role && decoded.role !== user.role?.name) {
      const previewRole = await Role.findOne({
        where: { name: decoded.role },
        include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
      });
      if (previewRole) {
        effectiveRoleName = previewRole.name;
        permissionNames = previewRole.permissions?.map(p => p.name) || [];
      }
    }

    // Attach user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: effectiveRoleName,
      baseRole: isOriginalAdmin ? 'Admin' : (user.role?.name || 'Viewer'),
      isOriginalAdmin,
      avatar: user.avatar,
      permissions: permissionNames
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate
};
