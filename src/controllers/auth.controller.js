const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body, req.user);
      return ApiResponse.created(res, user, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async switchRole(req, res, next) {
    try {
      const { role } = req.body;
      const result = await AuthService.switchRole(req.user.id, role, req.user);
      return ApiResponse.success(res, result, `Role switched to ${role} successfully`);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      return ApiResponse.success(res, user, 'Profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
