const OutwardService = require('../services/outward.service');
const ApiResponse = require('../utils/apiResponse');

class OutwardController {
  static async list(req, res, next) {
    try {
      const outwardList = await OutwardService.listOutward(req.query);
      return ApiResponse.success(res, outwardList, 'Outward dispatches retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const outward = await OutwardService.createOutward(req.body, req.user);
      return ApiResponse.created(res, outward, 'Outward recorded and stock deducted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await OutwardService.updateOutward(req.params.id, req.body, req.user);
      return ApiResponse.success(res, updated, 'Outward dispatch updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await OutwardService.deleteOutward(req.params.id, req.user);
      return ApiResponse.success(res, result, 'Outward dispatch deleted and inventory restored');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OutwardController;
