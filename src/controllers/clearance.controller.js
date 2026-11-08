const ClearanceService = require('../services/clearance.service');
const ApiResponse = require('../utils/apiResponse');

class ClearanceController {
  static async create(req, res, next) {
    try {
      const clearance = await ClearanceService.createClearance(req.body, req.user);
      return ApiResponse.created(res, clearance, 'Container clearance bill created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const list = await ClearanceService.listClearances(req.query);
      return ApiResponse.success(res, list, 'Clearance bills retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req, res, next) {
    try {
      const item = await ClearanceService.getClearanceById(req.params.id);
      return ApiResponse.success(res, item, 'Clearance bill retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await ClearanceService.updateClearance(req.params.id, req.body, req.user);
      return ApiResponse.success(res, updated, 'Clearance bill updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await ClearanceService.deleteClearance(req.params.id, req.user);
      return ApiResponse.success(res, result, 'Clearance bill deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClearanceController;
