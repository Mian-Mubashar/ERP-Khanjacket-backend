const { sequelize, Purchase, PurchaseItem, Article, Supplier, SupplierPayment } = require('../models');
const ApiError = require('../utils/apiError');
const AuditService = require('./audit.service');

class PurchaseService {
  /**
   * List all China import purchases with items and supplier info
   */
  static async listPurchases({ search, supplierId }) {
    const { Op } = require('sequelize');
    const where = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (search) {
      where[Op.or] = [
        { invoiceNo: { [Op.like]: `%${search}%` } },
        { containerNo: { [Op.like]: `%${search}%` } },
        { supplierName: { [Op.like]: `%${search}%` } }
      ];
    }

    return await Purchase.findAll({
      where,
      include: [
        { model: PurchaseItem, as: 'items' }
      ],
      order: [['purchaseDate', 'DESC']]
    });
  }

  /**
   * Get single purchase details
   */
  static async getPurchaseById(id) {
    const purchase = await Purchase.findByPk(id, {
      include: [
        { model: PurchaseItem, as: 'items' },
        { model: Supplier, as: 'supplier' }
      ]
    });

    if (!purchase) {
      throw ApiError.notFound(`Purchase record ${id} not found`);
    }

    return purchase;
  }

  /**
   * Record China import purchase invoice
   * Atomic Transaction across Purchase, Items, Article Stock, and Supplier Khata
   */
  static async createPurchase(purchaseData, currentUser) {
    const t = await sequelize.transaction();

    try {
      // 1. Calculate financials
      const itemsSubtotal = purchaseData.items.reduce(
        (sum, item) => sum + (Number(item.quantity) * Number(item.unitCost)),
        0
      );
      const extraExpenses = Number(purchaseData.extraExpenses) || 0;
      const totalBill = itemsSubtotal + extraExpenses;
      const paidAmount = Number(purchaseData.paidAmount) || 0;
      const remainingAmount = totalBill - paidAmount;

      const newId = `PUR-CN-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
      const purchaseDate = purchaseData.purchaseDate || new Date().toISOString().split('T')[0];

      // 2. Create Purchase Record
      const newPurchase = await Purchase.create({
        id: newId,
        invoiceNo: purchaseData.invoiceNo.trim(),
        supplierId: purchaseData.supplierId,
        supplierName: purchaseData.supplierName.trim(),
        purchaseDate,
        containerNo: purchaseData.containerNo || 'N/A',
        itemsSubtotal,
        extraExpenses,
        expenseNote: purchaseData.expenseNote || 'China to Karachi Freight & Customs',
        totalBill,
        paidAmount,
        remainingAmount,
        status: 'Received in Warehouse',
        notes: purchaseData.notes || ''
      }, { transaction: t });

      // 3. Create Item Lines and Increment Article Stocks
      const itemSummaries = [];
      for (const it of purchaseData.items) {
        const articleNo = it.articleNo.toUpperCase().trim();
        const quantity = Number(it.quantity);
        const unitCost = Number(it.unitCost);
        const total = quantity * unitCost;

        await PurchaseItem.create({
          purchaseId: newId,
          articleNo,
          articleName: it.articleName.trim(),
          category: it.category.trim(),
          quantity,
          unitCost,
          total
        }, { transaction: t });

        // Update Article stock and unit cost
        const article = await Article.findByPk(articleNo, { transaction: t });
        if (article) {
          await article.update({
            totalPurchased: article.totalPurchased + quantity,
            currentStock: article.currentStock + quantity,
            unitCost: unitCost // Update with latest landing unit cost
          }, { transaction: t });
        } else {
          // If article doesn't exist, create it automatically
          await Article.create({
            articleNo,
            name: it.articleName.trim(),
            category: it.category.trim(),
            stuff: 'Parachute (Waterproof)',
            totalPurchased: quantity,
            totalOut: 0,
            currentStock: quantity,
            unitCost
          }, { transaction: t });
        }

        itemSummaries.push(`${articleNo} (${quantity} pcs)`);
      }

      // 4. Update Supplier Balance
      const supplier = await Supplier.findByPk(purchaseData.supplierId, { transaction: t });
      if (supplier) {
        await supplier.update({
          totalPurchases: Number(supplier.totalPurchases) + totalBill,
          totalPayments: Number(supplier.totalPayments) + paidAmount,
          remainingBalance: Number(supplier.remainingBalance) + remainingAmount
        }, { transaction: t });
      }

      // 5. If paidAmount > 0, record initial payment
      if (paidAmount > 0) {
        const payId = `PAY-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
        await SupplierPayment.create({
          id: payId,
          supplierId: purchaseData.supplierId,
          supplierName: purchaseData.supplierName,
          date: purchaseDate,
          amount: paidAmount,
          paymentMethod: purchaseData.paymentMethod || 'Bank TT / Wire Transfer',
          refNo: purchaseData.invoiceNo,
          notes: `Advance/Initial payment with Invoice ${purchaseData.invoiceNo}`,
          recordedBy: currentUser?.name || 'Admin'
        }, { transaction: t });
      }

      // 6. Record Audit Log
      await AuditService.log({
        action: 'Purchase Recorded',
        category: 'China Import',
        details: `Invoice #${newPurchase.invoiceNo} from ${newPurchase.supplierName}. Total Bill: Rs. ${totalBill.toLocaleString()}`,
        impact: `Stock incremented: ${itemSummaries.join(', ')}. Paid: Rs. ${paidAmount.toLocaleString()}, Balance: Rs. ${remainingAmount.toLocaleString()}`,
        user: currentUser,
        transaction: t
      });

      // Commit transaction
      await t.commit();

      // Return complete purchase record with items
      return await Purchase.findByPk(newId, {
        include: [{ model: PurchaseItem, as: 'items' }]
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = PurchaseService;
