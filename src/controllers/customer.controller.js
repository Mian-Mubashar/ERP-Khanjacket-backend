const CustomerService = require('../services/customer.service');
const ApiResponse = require('../utils/apiResponse');

class CustomerController {
  static async list(req, res, next) {
    try {
      const customers = await CustomerService.listCustomers(req.query);
      return ApiResponse.success(res, customers, 'Customers retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req, res, next) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      return ApiResponse.success(res, customer, 'Customer khata retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const customer = await CustomerService.createCustomer(req.body, req.user);
      return ApiResponse.created(res, customer, 'Shopkeeper registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const customer = await CustomerService.updateCustomer(req.params.id, req.body, req.user);
      return ApiResponse.success(res, customer, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await CustomerService.deleteCustomer(req.params.id, req.user);
      return ApiResponse.success(res, result, 'Customer deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CustomerController;
