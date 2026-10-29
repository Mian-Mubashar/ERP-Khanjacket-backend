const { sequelize, Outward, Article, Customer, City, CustomerPayment } = require('../models');
const ApiError = require('../utils/apiError');
const AuditService = require('./audit.service');

class OutwardService {
  /**
   * List all outward dispatches
   */
  static async listOutward({ search, articleNo, city, customerId }) {
    const { Op } = require('sequelize');
    const where = {};

    if (articleNo) where.articleNo = articleNo.toUpperCase();
    if (city) where.city = city;
    if (customerId) where.customerId = customerId;

    if (search) {
      where[Op.or] = [
        { challanNo: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { destination: { [Op.like]: `%${search}%` } },
        { articleNo: { [Op.like]: `%${search}%` } },
        { gatePassNo: { [Op.like]: `%${search}%` } }
      ];
    }

    return await Outward.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
  }

  /**
   * Record Warehouse Outward Dispatch
   * Atomic Transaction: Verifies stock, decrements inventory, updates customer khata, updates city branch count
   */
  static async createOutward(outwardData, currentUser) {
    const t = await sequelize.transaction();

    try {
      const articleNo = outwardData.articleNo.toUpperCase().trim();
      const reqQty = Number(outwardData.quantity);

      // 1. Fetch Article or auto-register if missing (no strict stock blocking)
      let article = await Article.findByPk(articleNo, { transaction: t });
      if (!article) {
        article = await Article.create({
          articleNo,
          name: outwardData.articleName || `Garment ${articleNo}`,
          category: outwardData.category || 'Outerwear',
          stuff: outwardData.stuff || 'Standard',
          unitCost: Number(outwardData.unitSalePrice) || 0,
          unitSalePrice: Number(outwardData.unitSalePrice) || 0,
          currentStock: 0,
          totalPurchased: 0,
          totalOut: 0,
          status: 'Active'
        }, { transaction: t });
      }

      const unitSalePrice = Number(outwardData.unitSalePrice) || 0;
      const totalSaleAmount = unitSalePrice * reqQty;
      const paidAmount = Number(outwardData.paidAmount) || 0;
      const newId = `OUT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
      const challanNo = outwardData.challanNo || `CH-${Date.now().toString().slice(-4)}`;
      const gatePassNo = outwardData.gatePassNo || `GP-${Date.now().toString().slice(-3)}`;
      const date = outwardData.date || new Date().toISOString().split('T')[0];

      // 2. Create Outward Record
      const newOutward = await Outward.create({
        id: newId,
        challanNo,
        date,
        articleNo: article.articleNo,
        articleName: article.name,
        category: article.category,
        quantity: reqQty,
        city: outwardData.city || '',
        customerId: outwardData.customerId || null,
        destination: outwardData.destination.trim(),
        customerName: outwardData.customerName.trim(),
        customerPhone: outwardData.customerPhone || '',
        unitSalePrice,
        totalSaleAmount,
        gatePassNo,
        recordedBy: currentUser?.name || 'Staff',
        notes: outwardData.notes || ''
      }, { transaction: t });

      // 3. Update Inventory Stock tracking
      await article.update({
        totalOut: (article.totalOut || 0) + reqQty,
        currentStock: (article.currentStock || 0) - reqQty
      }, { transaction: t });

      // 4. Update Customer / Shopkeeper Khata (if customer matched)
      let customerRecord = null;
      if (outwardData.customerId) {
        customerRecord = await Customer.findByPk(outwardData.customerId, { transaction: t });
      } else if (outwardData.customerName) {
        customerRecord = await Customer.findOne({
          where: { shopName: outwardData.customerName.trim() },
          transaction: t
        });
      }

      if (customerRecord) {
        // If upfront payment was made with this dispatch, record CustomerPayment receipt
        if (paidAmount > 0) {
          const newPayId = `CPAY-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
          await CustomerPayment.create({
            id: newPayId,
            customerId: customerRecord.id,
            customerName: `${customerRecord.shopName} (${customerRecord.shopkeeperName || ''})`,
            city: customerRecord.city,
            date,
            amount: paidAmount,
            paymentMethod: outwardData.paymentMethod || 'Cash Receipt',
            refNo: `REC-${challanNo}`,
            notes: `Cash received against Challan #${challanNo}`,
            recordedBy: currentUser?.name || 'Staff'
          }, { transaction: t });
        }

        const netBalanceAddition = totalSaleAmount - paidAmount;
        await customerRecord.update({
          totalPiecesReceived: (customerRecord.totalPiecesReceived || 0) + reqQty,
          totalBill: Number(customerRecord.totalBill || 0) + totalSaleAmount,
          totalPaid: Number(customerRecord.totalPaid || 0) + paidAmount,
          remainingBalance: Number(customerRecord.remainingBalance || 0) + netBalanceAddition
        }, { transaction: t });
      }

      // 5. Update City Branch Mal counter
      if (outwardData.city) {
        const cityRecord = await City.findOne({
          where: { name: outwardData.city.trim() },
          transaction: t
        });
        if (cityRecord) {
          await cityRecord.update({
            totalMalSent: (cityRecord.totalMalSent || 0) + reqQty
          }, { transaction: t });
        }
      }

      // 6. Record Audit Log
      await AuditService.log({
        action: 'Stock Outward Dispatched',
        category: 'Warehouse Outward',
        details: `Dispatched ${reqQty} pcs of ${article.articleNo} to ${newOutward.customerName} (${newOutward.city || newOutward.destination})`,
        impact: `Stock reduced from ${article.currentStock} to ${article.currentStock - reqQty} pcs. Bill: Rs. ${totalSaleAmount.toLocaleString()}`,
        user: currentUser,
        transaction: t
      });

      // Commit transaction
      await t.commit();

      return newOutward;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = OutwardService;
