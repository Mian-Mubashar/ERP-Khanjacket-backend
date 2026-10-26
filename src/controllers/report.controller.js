const { Article, Purchase, Outward, Supplier, Customer } = require('../models');
const ApiResponse = require('../utils/apiResponse');

class ReportController {
  static async getDashboardMetrics(req, res, next) {
    try {
      const articles = await Article.findAll();
      const suppliers = await Supplier.findAll();
      const customers = await Customer.findAll();
      const purchases = await Purchase.findAll();
      const outwardList = await Outward.findAll();

      // Calculations
      const totalStockPcs = articles.reduce((sum, a) => sum + (Number(a.currentStock) || 0), 0);
      const totalStockValuation = articles.reduce((sum, a) => sum + ((Number(a.currentStock) || 0) * (Number(a.unitCost) || 0)), 0);
      const lowStockCount = articles.filter(a => a.currentStock <= a.minAlertStock).length;

      const totalSupplierPayables = suppliers.reduce((sum, s) => sum + (Number(s.remainingBalance) || 0), 0);
      const totalCustomerReceivables = customers.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);

      const totalChinaPurchasesBill = purchases.reduce((sum, p) => sum + (Number(p.totalBill) || 0), 0);
      const totalOutwardSalesAmount = outwardList.reduce((sum, o) => sum + (Number(o.totalSaleAmount) || 0), 0);
      const totalOutwardPieces = outwardList.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);

      return ApiResponse.success(res, {
        stock: {
          totalPieces: totalStockPcs,
          totalValuationPKR: totalStockValuation,
          uniqueArticlesCount: articles.length,
          lowStockAlertCount: lowStockCount
        },
        financials: {
          supplierPayables: totalSupplierPayables,
          customerReceivables: totalCustomerReceivables,
          totalPurchasesInward: totalChinaPurchasesBill,
          totalSalesOutward: totalOutwardSalesAmount
        },
        counts: {
          articles: articles.length,
          suppliers: suppliers.length,
          customers: customers.length,
          purchases: purchases.length,
          outwardDispatches: outwardList.length,
          totalOutwardPieces
        }
      }, 'Dashboard metrics computed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReportController;
