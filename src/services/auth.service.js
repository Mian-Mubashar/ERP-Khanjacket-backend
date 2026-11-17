const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const { User, Role, Permission } = require('../models');
const AuditService = require('./audit.service');

class AuthService {
  /**
   * Generate JWT Token
   */
  static generateToken(user, overrideRole = null) {
    const isOriginalAdmin = user.email.toLowerCase() === config.defaultAdmin.email.toLowerCase() || user.role?.name === 'Admin';
    const activeRole = overrideRole || user.role?.name || 'Viewer';
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: activeRole,
        baseRole: isOriginalAdmin ? 'Admin' : (user.role?.name || 'Viewer'),
        isOriginalAdmin
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Authenticate user with email and password
   */
  static async login(email, password) {
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
      include: [
        {
          model: Role,
          as: 'role',
          include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
        }
      ]
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status !== 'Active') {
      throw ApiError.forbidden('Your account is suspended. Contact administrator.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Always guarantee that default accounts have their true designated base role restored on login
    const isDefaultAdmin = user.email.toLowerCase() === config.defaultAdmin.email.toLowerCase();
    const isDefaultStaff = user.email.toLowerCase() === config.defaultStaff.email.toLowerCase();
    const isDefaultViewer = user.email.toLowerCase() === config.defaultViewer.email.toLowerCase();

    let targetRoleName = null;
    if (isDefaultAdmin) targetRoleName = 'Admin';
    else if (isDefaultStaff) targetRoleName = 'Staff';
    else if (isDefaultViewer) targetRoleName = 'Viewer';

    if (targetRoleName && user.role?.name !== targetRoleName) {
      const targetRole = await Role.findOne({
        where: { name: targetRoleName },
        include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
      });
      if (targetRole) {
        user.roleId = targetRole.id;
        user.role = targetRole;
        await user.save();
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const isOriginalAdmin = user.email.toLowerCase() === config.defaultAdmin.email.toLowerCase() || user.role?.name === 'Admin';
    const token = this.generateToken(user, user.role?.name);
    const permissions = user.role?.permissions?.map(p => p.name) || [];

    await AuditService.log({
      action: 'User Logged In',
      category: 'Authentication',
      details: `${user.name} logged into warehouse system from portal`,
      impact: 'Session created',
      user: { name: user.name, role: user.role?.name }
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        baseRole: isOriginalAdmin ? 'Admin' : (user.role?.name || 'Viewer'),
        isOriginalAdmin,
        avatar: user.avatar,
        permissions
      }
    };
  }

  /**
   * Register a new user
   */
  static async register({ name, email, password, role = 'Staff' }, creatorUser = null) {
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      throw ApiError.conflict(`User with email "${email}" already exists`);
    }

    const roleRecord = await Role.findOne({ where: { name: role } });
    if (!roleRecord) {
      throw ApiError.badRequest(`Role "${role}" does not exist`);
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      roleId: roleRecord.id
    });

    await AuditService.log({
      action: 'User Registered',
      category: 'Security & Access',
      details: `Created user account for ${newUser.name} with role: ${roleRecord.name}`,
      impact: 'New user added',
      user: creatorUser
    });

    return newUser;
  }

  /**
   * Switch user role (demo/convenience endpoint for previewing access levels)
   */
  static async switchRole(userId, newRoleName, currentUser) {
    const isAuthorizedAdmin = 
      currentUser?.isOriginalAdmin || 
      currentUser?.baseRole?.toLowerCase() === 'admin' || 
      currentUser?.role?.toLowerCase() === 'admin' || 
      currentUser?.email?.toLowerCase() === config.defaultAdmin.email.toLowerCase();

    if (!isAuthorizedAdmin) {
      throw ApiError.forbidden('Only administrators are authorized to switch preview roles.');
    }

    const roleRecord = await Role.findOne({
      where: { name: newRoleName },
      include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
    });

    if (!roleRecord) {
      throw ApiError.badRequest(`Role "${newRoleName}" is invalid`);
    }

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
        }
      ]
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Protect dedicated staff and viewer credentials from having their roles altered
    if (user.email === config.defaultStaff.email || user.email === config.defaultViewer.email) {
      throw ApiError.forbidden('Default staff and viewer account roles cannot be altered. Log in directly with the appropriate credentials.');
    }

    // Default admin account's role in MySQL is NEVER downgraded so they never get trapped!
    // Instead, a session preview token is generated for the new preview role.
    const isDefaultAdmin = user.email.toLowerCase() === config.defaultAdmin.email.toLowerCase();
    if (!isDefaultAdmin) {
      user.roleId = roleRecord.id;
      await user.save();
    }

    const token = this.generateToken(user, newRoleName);
    const permissions = roleRecord.permissions?.map(p => p.name) || [];

    await AuditService.log({
      action: 'Role Switched (Preview)',
      category: 'Security & Access',
      details: `Admin ${user.name} switched view to ${newRoleName}`,
      impact: `Session privileges previewing: ${newRoleName}`,
      user: currentUser
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: newRoleName,
        baseRole: 'Admin',
        isOriginalAdmin: true,
        avatar: user.avatar,
        permissions
      }
    };
  }

  /**
   * Fetch current user info with permissions (supports preview role for Admin)
   */
  static async getMe(userId, requestingUser = null) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
        }
      ]
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isOriginalAdmin = user.email.toLowerCase() === config.defaultAdmin.email.toLowerCase() || user.role?.name === 'Admin';
    const effectiveRole = (isOriginalAdmin && requestingUser?.role) ? requestingUser.role : (user.role?.name || 'Viewer');

    let permissions = user.role?.permissions?.map(p => p.name) || [];
    if (isOriginalAdmin && effectiveRole !== user.role?.name) {
      const previewRole = await Role.findOne({
        where: { name: effectiveRole },
        include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
      });
      if (previewRole) {
        permissions = previewRole.permissions?.map(p => p.name) || [];
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: effectiveRole,
      baseRole: isOriginalAdmin ? 'Admin' : (user.role?.name || 'Viewer'),
      isOriginalAdmin,
      avatar: user.avatar,
      permissions
    };
  }

  /**
   * Update user profile (Name and Avatar)
   */
  static async updateProfile(userId, { name, avatar }, currentUser) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
        }
      ]
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    const permissions = user.role?.permissions?.map(p => p.name) || [];

    await AuditService.log({
      action: 'Profile Updated',
      category: 'Security & Access',
      details: `Profile updated for ${user.name}`,
      impact: 'Name or avatar updated',
      user: currentUser
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
      avatar: user.avatar,
      permissions
    };
  }
}

module.exports = AuthService;
