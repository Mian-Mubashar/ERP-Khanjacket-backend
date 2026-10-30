const PurchaseService = require('../services/purchase.service');
const ApiResponse = require('../utils/apiResponse');

class PurchaseController {
  static async list(req, res, next) {
    try {
      const purchases = await PurchaseService.listPurchases(req.query);
      return ApiResponse.success(res, purchases, 'Purchases retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req, res, next) {
    try {
      const purchase = await PurchaseService.getPurchaseById(req.params.id);
      return ApiResponse.success(res, purchase, 'Purchase details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const purchase = await PurchaseService.createPurchase(req.body, req.user);
      return ApiResponse.created(res, purchase, 'Purchase recorded and stock incremented successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await PurchaseService.updatePurchase(req.params.id, req.body, req.user);
      return ApiResponse.success(res, updated, 'Purchase updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await PurchaseService.deletePurchase(req.params.id, req.user);
      return ApiResponse.success(res, result, 'Purchase deleted and stock reverted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PurchaseController;
