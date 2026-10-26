const SupplierService = require('../services/supplier.service');
const CustomerService = require('../services/customer.service');
const ApiResponse = require('../utils/apiResponse');

class PaymentController {
  // Supplier Payments
  static async recordSupplierPayment(req, res, next) {
    try {
      const payment = await SupplierService.recordPayment(req.body, req.user);
      return ApiResponse.created(res, payment, 'Supplier payment recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listSupplierPayments(req, res, next) {
    try {
      const payments = await SupplierService.listPayments(req.query);
      return ApiResponse.success(res, payments, 'Supplier payments retrieved');
    } catch (error) {
      next(error);
    }
  }

  // Customer Payments
  static async recordCustomerPayment(req, res, next) {
    try {
      const payment = await CustomerService.recordPayment(req.body, req.user);
      return ApiResponse.created(res, payment, 'Customer payment receipt recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listCustomerPayments(req, res, next) {
    try {
      const payments = await CustomerService.listPayments(req.query);
      return ApiResponse.success(res, payments, 'Customer payments retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;
