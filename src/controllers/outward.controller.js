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
}

module.exports = OutwardController;
