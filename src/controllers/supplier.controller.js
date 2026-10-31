const SupplierService = require('../services/supplier.service');
const ApiResponse = require('../utils/apiResponse');

class SupplierController {
  static async list(req, res, next) {
    try {
      const suppliers = await SupplierService.listSuppliers(req.query);
      return ApiResponse.success(res, suppliers, 'Suppliers retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req, res, next) {
    try {
      const supplier = await SupplierService.getSupplierById(req.params.id);
      return ApiResponse.success(res, supplier, 'Supplier details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const supplier = await SupplierService.createSupplier(req.body, req.user);
      return ApiResponse.created(res, supplier, 'Supplier registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const supplier = await SupplierService.updateSupplier(req.params.id, req.body, req.user);
      return ApiResponse.success(res, supplier, 'Supplier updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await SupplierService.deleteSupplier(req.params.id, req.user);
      return ApiResponse.success(res, result, 'Supplier deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SupplierController;
