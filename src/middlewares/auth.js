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

    const permissionNames = user.role?.permissions?.map(p => p.name) || [];

    // Attach user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name || 'Viewer',
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
