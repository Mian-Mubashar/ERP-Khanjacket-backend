const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const { User, Role, Permission } = require('../models');
const AuditService = require('./audit.service');

class AuthService {
  /**
   * Generate JWT Token
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role?.name
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

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user);
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
   * Switch user role (demo/convenience endpoint)
   */
  static async switchRole(userId, newRoleName, currentUser) {
    const roleRecord = await Role.findOne({
      where: { name: newRoleName },
      include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
    });

    if (!roleRecord) {
      throw ApiError.badRequest(`Role "${newRoleName}" is invalid`);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.roleId = roleRecord.id;
    await user.save();

    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
        }
      ]
    });

    const token = this.generateToken(updatedUser);
    const permissions = roleRecord.permissions?.map(p => p.name) || [];

    await AuditService.log({
      action: 'Role Switched',
      category: 'Security & Access',
      details: `Changed role for ${user.name} to ${newRoleName}`,
      impact: `Privileges updated to: ${newRoleName}`,
      user: currentUser
    });

    return {
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role.name,
        permissions
      }
    };
  }

  /**
   * Fetch current user info with permissions
   */
  static async getMe(userId) {
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

    const permissions = user.role?.permissions?.map(p => p.name) || [];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
      permissions
    };
  }
}

module.exports = AuthService;
