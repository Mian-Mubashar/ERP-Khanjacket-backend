const { sequelize, CustomerReturn, Customer, Article } = require('../models');
const ApiError = require('../utils/apiError');
const AuditService = require('./audit.service');

class CustomerReturnService {
  /**
   * List customer sales returns with filtering
   */
  static async listReturns({ customerId, articleNo, search }) {
    const { Op } = require('sequelize');
    const where = {};

    if (customerId) where.customerId = customerId;
    if (articleNo) where.articleNo = articleNo.toUpperCase();

    if (search) {
      where[Op.or] = [
        { returnSlipNo: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { articleNo: { [Op.like]: `%${search}%` } },
        { articleName: { [Op.like]: `%${search}%` } },
        { reason: { [Op.like]: `%${search}%` } }
      ];
    }

    return await CustomerReturn.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
  }

  /**
   * Record Customer Maal Wapsi (Sales Return)
   * Atomic Transaction:
   * 1. Restores warehouse inventory stock (+quantity to currentStock, -quantity from totalOut)
   * 2. Deducts return totalAmount from customer's khata remainingBalance
   * 3. Adjusts customer's totalPiecesReceived
   * 4. Logs audit trail & system activity
   */
  static async createReturn(data, currentUser) {
    const t = await sequelize.transaction();

    try {
      const customerId = data.customerId;
      if (!customerId) throw ApiError.badRequest('Customer ID is required');

      const customer = await Customer.findByPk(customerId, { transaction: t });
      if (!customer) throw ApiError.notFound('Customer record not found');

      const articleNo = (data.articleNo || '').toUpperCase().trim();
      if (!articleNo) throw ApiError.badRequest('Article # is required for return');

      const article = await Article.findByPk(articleNo, { transaction: t });
      if (!article) throw ApiError.notFound(`Article "${articleNo}" not found in inventory`);

      const quantity = Math.max(1, parseInt(data.quantity, 10) || 1);
      const unitPrice = Math.max(0, Number(data.unitPrice) || 0);
      const totalAmount = unitPrice * quantity;
      const restoreStock = data.restoreStock !== undefined ? Boolean(data.restoreStock) : true;
      const date = data.date || new Date().toISOString().split('T')[0];

      const returnId = `RET-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
      const returnSlipNo = data.returnSlipNo || `MW-${Date.now().toString().slice(-4)}`;

      // 1. Create Return Record
      const newReturn = await CustomerReturn.create({
        id: returnId,
        returnSlipNo,
        date,
        customerId: customer.id,
        customerName: `${customer.shopName} (${customer.shopkeeperName || ''})`.trim(),
        city: customer.city,
        articleNo: article.articleNo,
        articleName: article.name,
        quantity,
        unitPrice,
        totalAmount,
        reason: data.reason || 'General Maal Wapsi',
        restoreStock,
        recordedBy: currentUser?.name || 'Staff',
        notes: data.notes || ''
      }, { transaction: t });

      // 2. Restore Warehouse Inventory Stock
      if (restoreStock) {
        await article.update({
          currentStock: (article.currentStock || 0) + quantity,
          totalOut: Math.max(0, (article.totalOut || 0) - quantity)
        }, { transaction: t });
      }

      // 3. Cut from Customer's Khata Balance & pieces
      const prevBal = Number(customer.remainingBalance) || 0;
      const prevPieces = Number(customer.totalPiecesReceived) || 0;

      await customer.update({
        totalPiecesReceived: Math.max(0, prevPieces - quantity),
        remainingBalance: prevBal - totalAmount
      }, { transaction: t });

      // 4. Record Audit Log
      await AuditService.log({
        action: 'Customer Maal Wapsi Recorded',
        category: 'Customer Khata',
        details: `Maal Wapsi of ${quantity} pcs (${article.articleNo}) from ${customer.shopName} (Slip: ${returnSlipNo}) @ Rs. ${unitPrice}/pc = Rs. ${totalAmount.toLocaleString()}`,
        impact: `Customer khata credited by Rs. ${totalAmount.toLocaleString()}${restoreStock ? `; Warehouse stock restored +${quantity} pcs` : ''}`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return {
        returnRecord: newReturn,
        updatedCustomer: await Customer.findByPk(customerId),
        updatedArticle: await Article.findByPk(articleNo)
      };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Delete a customer return (reverts inventory stock and restores customer balance)
   */
  static async deleteReturn(id, currentUser) {
    const t = await sequelize.transaction();

    try {
      const returnRecord = await CustomerReturn.findByPk(id, { transaction: t });
      if (!returnRecord) throw ApiError.notFound('Return record not found');

      // 1. Revert Inventory Stock if it was restored
      if (returnRecord.restoreStock) {
        const article = await Article.findByPk(returnRecord.articleNo, { transaction: t });
        if (article) {
          await article.update({
            currentStock: (article.currentStock || 0) - returnRecord.quantity,
            totalOut: (article.totalOut || 0) + returnRecord.quantity
          }, { transaction: t });
        }
      }

      // 2. Revert Customer Khata (restore balance and pieces back)
      const customer = await Customer.findByPk(returnRecord.customerId, { transaction: t });
      if (customer) {
        await customer.update({
          totalPiecesReceived: (customer.totalPiecesReceived || 0) + returnRecord.quantity,
          remainingBalance: Number(customer.remainingBalance || 0) + Number(returnRecord.totalAmount || 0)
        }, { transaction: t });
      }

      await returnRecord.destroy({ transaction: t });

      // 3. Audit Log
      await AuditService.log({
        action: 'Customer Maal Wapsi Deleted',
        category: 'Customer Khata',
        details: `Deleted Maal Wapsi ${returnRecord.returnSlipNo} of ${returnRecord.quantity} pcs (${returnRecord.articleNo}) for ${returnRecord.customerName}`,
        impact: `Reverted customer balance +Rs. ${Number(returnRecord.totalAmount).toLocaleString()}`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return { success: true, message: 'Customer return deleted and balances reverted successfully' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}

module.exports = CustomerReturnService;

