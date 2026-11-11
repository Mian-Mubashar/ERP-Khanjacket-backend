const CustomerReturnService = require('../services/customerReturn.service');
const ApiResponse = require('../utils/apiResponse');

class CustomerReturnController {
  static async list(req, res, next) {
    try {
      const returns = await CustomerReturnService.listReturns(req.query);
      return ApiResponse.success(res, returns, 'Customer returns retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const result = await CustomerReturnService.createReturn(req.body, req.user);
      return ApiResponse.created(res, result, 'Maal Wapsi recorded successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await CustomerReturnService.deleteReturn(req.params.id, req.user);
      return ApiResponse.success(res, result, 'Maal Wapsi entry deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CustomerReturnController;

