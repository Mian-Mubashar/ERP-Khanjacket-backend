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

      // 2. Fetch and Validate Supplier exists in database
      const supplier = await Supplier.findByPk(purchaseData.supplierId, { transaction: t });
      if (!supplier) {
        throw ApiError.badRequest(`Supplier with ID "${purchaseData.supplierId}" not found in database`);
      }

      // 3. Create Purchase Record
      const newPurchase = await Purchase.create({
        id: newId,
        invoiceNo: purchaseData.invoiceNo.trim(),
        supplierId: purchaseData.supplierId,
        supplierName: (supplier.company || purchaseData.supplierName).trim(),
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

      // 4. Increment Article Stocks and Create Item Lines
      // CRITICAL: Ensure Article exists in database BEFORE inserting into purchase_items
      // to satisfy MySQL foreign key constraint (purchase_items.articleNo -> articles.articleNo)
      const itemSummaries = [];
      for (const it of purchaseData.items) {
        const articleNo = it.articleNo.toUpperCase().trim();
        const quantity = Number(it.quantity);
        const unitCost = Number(it.unitCost);
        const total = quantity * unitCost;

        // Ensure Article exists in database first
        const article = await Article.findByPk(articleNo, { transaction: t });
        if (article) {
          await article.update({
            totalPurchased: Number(article.totalPurchased || 0) + quantity,
            currentStock: Number(article.currentStock || 0) + quantity,
            unitCost: unitCost // Update with latest landing unit cost
          }, { transaction: t });
        } else {
          // If article doesn't exist, create it automatically first
          await Article.create({
            articleNo,
            name: it.articleName.trim(),
            category: it.category?.trim() || 'Jacket',
            stuff: 'Parachute (Waterproof)',
            totalPurchased: quantity,
            totalOut: 0,
            currentStock: quantity,
            unitCost
          }, { transaction: t });
        }

        // Now create PurchaseItem line safely
        await PurchaseItem.create({
          purchaseId: newId,
          articleNo,
          articleName: it.articleName.trim(),
          category: it.category?.trim() || 'Jacket',
          quantity,
          unitCost,
          total
        }, { transaction: t });

        itemSummaries.push(`${articleNo} (${quantity} pcs)`);
      }

      // 5. Update Supplier Balance
      await supplier.update({
        totalPurchases: Number(supplier.totalPurchases || 0) + totalBill,
        totalPayments: Number(supplier.totalPayments || 0) + paidAmount,
        remainingBalance: Number(supplier.remainingBalance || 0) + remainingAmount
      }, { transaction: t });

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

  /**
   * Update purchase invoice metadata (date, container, notes, expenses, payment)
   */
  static async updatePurchase(id, data, currentUser) {
    const t = await sequelize.transaction();
    try {
      const purchase = await Purchase.findByPk(id, { transaction: t });
      if (!purchase) {
        throw ApiError.notFound(`Purchase record "${id}" not found`);
      }

      const updates = {};
      if (data.purchaseDate) updates.purchaseDate = data.purchaseDate;
      if (data.containerNo !== undefined) updates.containerNo = data.containerNo;
      if (data.invoiceNo) updates.invoiceNo = data.invoiceNo;
      if (data.notes !== undefined) updates.notes = data.notes;
      if (data.expenseNote !== undefined) updates.expenseNote = data.expenseNote;

      let billDiff = 0;
      let paidDiff = 0;

      if (data.extraExpenses !== undefined) {
        const oldExpenses = Number(purchase.extraExpenses) || 0;
        const newExpenses = Number(data.extraExpenses) || 0;
        const expenseDiff = newExpenses - oldExpenses;
        updates.extraExpenses = newExpenses;
        updates.totalBill = (Number(purchase.totalBill) || 0) + expenseDiff;
        billDiff += expenseDiff;
      }

      if (data.paidAmount !== undefined) {
        const oldPaid = Number(purchase.paidAmount) || 0;
        const newPaid = Number(data.paidAmount) || 0;
        paidDiff = newPaid - oldPaid;
        updates.paidAmount = newPaid;
      }

      if (billDiff !== 0 || paidDiff !== 0) {
        const newTotalBill = updates.totalBill !== undefined ? updates.totalBill : Number(purchase.totalBill);
        const newPaidAmount = updates.paidAmount !== undefined ? updates.paidAmount : Number(purchase.paidAmount);
        updates.remainingAmount = newTotalBill - newPaidAmount;

        // Adjust supplier balance if supplierId is present
        if (purchase.supplierId) {
          const supplier = await Supplier.findByPk(purchase.supplierId, { transaction: t });
          if (supplier) {
            await supplier.update({
              totalPurchases: Math.max(0, (Number(supplier.totalPurchases) || 0) + billDiff),
              totalPayments: Math.max(0, (Number(supplier.totalPayments) || 0) + paidDiff),
              remainingBalance: (Number(supplier.remainingBalance) || 0) + (billDiff - paidDiff)
            }, { transaction: t });
          }
        }
      }

      await purchase.update(updates, { transaction: t });

      await AuditService.log({
        action: 'Purchase Updated',
        category: 'China Import',
        details: `Updated purchase invoice #${purchase.invoiceNo} (${purchase.supplierName})`,
        impact: `Metadata updated${billDiff !== 0 ? `, bill adjusted by Rs. ${billDiff.toLocaleString()}` : ''}`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return await Purchase.findByPk(id, {
        include: [{ model: PurchaseItem, as: 'items' }]
      });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Delete purchase invoice and safely revert stock and supplier balance
   */
  static async deletePurchase(id, currentUser) {
    const t = await sequelize.transaction();
    try {
      const purchase = await Purchase.findByPk(id, {
        include: [{ model: PurchaseItem, as: 'items' }],
        transaction: t
      });
      if (!purchase) {
        throw ApiError.notFound(`Purchase record "${id}" not found`);
      }

      // 1. Revert article stock
      for (const item of purchase.items || []) {
        const article = await Article.findOne({ where: { articleNo: item.articleNo }, transaction: t });
        if (article) {
          const qty = Number(item.quantity) || 0;
          await article.update({
            totalPurchased: Math.max(0, (Number(article.totalPurchased) || 0) - qty),
            currentStock: (Number(article.currentStock) || 0) - qty
          }, { transaction: t });
        }
      }

      // 2. Revert supplier balance
      if (purchase.supplierId) {
        const supplier = await Supplier.findByPk(purchase.supplierId, { transaction: t });
        if (supplier) {
          const billAmt = Number(purchase.totalBill) || 0;
          const paidAmt = Number(purchase.paidAmount) || 0;
          await supplier.update({
            totalPurchases: Math.max(0, (Number(supplier.totalPurchases) || 0) - billAmt),
            totalPayments: Math.max(0, (Number(supplier.totalPayments) || 0) - paidAmt),
            remainingBalance: (Number(supplier.remainingBalance) || 0) - (billAmt - paidAmt)
          }, { transaction: t });
        }
      }

      // 3. Delete items and purchase
      await PurchaseItem.destroy({ where: { purchaseId: id }, transaction: t });
      await purchase.destroy({ transaction: t });

      await AuditService.log({
        action: 'Purchase Deleted',
        category: 'China Import',
        details: `Deleted purchase invoice #${purchase.invoiceNo} (${purchase.supplierName})`,
        impact: `Reverted Rs. ${Number(purchase.totalBill).toLocaleString()} from supplier balance & stock`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return { success: true, message: 'Purchase invoice deleted successfully' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}

module.exports = PurchaseService;
