const {
  Article,
  Purchase,
  PurchaseItem,
  Outward,
  Supplier,
  Customer,
  SupplierPayment,
  CustomerPayment,
  Device,
  AuditLog,
  City,
  Stuff,
  Category
} = require('../models');
const ApiResponse = require('../utils/apiResponse');
const AuditService = require('../services/audit.service');

class BackupController {
  static async exportBackup(req, res, next) {
    try {
      const [
        articles,
        purchases,
        outward,
        suppliers,
        customers,
        supplierPayments,
        customerPayments,
        devices,
        auditLogs,
        cities,
        stuffs,
        categories
      ] = await Promise.all([
        Article.findAll(),
        Purchase.findAll({ include: [{ model: PurchaseItem, as: 'items' }] }),
        Outward.findAll(),
        Supplier.findAll(),
        Customer.findAll(),
        SupplierPayment.findAll(),
        CustomerPayment.findAll(),
        Device.findAll(),
        AuditLog.findAll({ limit: 200, order: [['createdAt', 'DESC']] }),
        City.findAll(),
        Stuff.findAll(),
        Category.findAll()
      ]);

      const backupData = {
        app: 'Khan Clothes Warehouse & Inventory System',
        version: '2.4.0',
        exportedAt: new Date().toISOString(),
        exportedBy: req.user?.name || 'Admin',
        statistics: {
          articlesCount: articles.length,
          purchasesCount: purchases.length,
          outwardCount: outward.length,
          suppliersCount: suppliers.length,
          customersCount: customers.length,
          devicesCount: devices.length,
          auditLogsCount: auditLogs.length
        },
        data: {
          articles,
          purchases,
          outward,
          suppliers,
          customers,
          supplierPayments,
          customerPayments,
          devices,
          auditLogs,
          cities,
          stuffs,
          categories
        }
      };

      await AuditService.log({
        action: 'Database Backup Exported',
        category: 'Cloud Backup & 2FA',
        details: `Complete JSON snapshot exported by ${req.user?.name || 'Admin'}`,
        impact: `Snapshot contained ${articles.length} articles, ${purchases.length} purchases, ${outward.length} dispatches`,
        user: req.user
      });

      return ApiResponse.success(res, backupData, 'System backup exported successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BackupController;
