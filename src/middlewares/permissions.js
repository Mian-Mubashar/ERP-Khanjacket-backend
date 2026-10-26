const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');

/**
 * RBAC Permission Guard: Requires a specific permission
 * Admins automatically bypass permission checks (superuser)
 */
const requirePermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Super Admin has all privileges
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permissionName)) {
      return next(
        ApiError.forbidden(
          `Permission denied: Missing required permission "${permissionName}". Your role is "${req.user.role}".`
        )
      );
    }

    next();
  };
};

/**
 * Role Guard: Requires one of the specified roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access restricted: Requires one of [${allowedRoles.join(', ')}] role. Current role is "${req.user.role}".`
        )
      );
    }

    next();
  };
};

module.exports = {
  requirePermission,
  requireRole
};
