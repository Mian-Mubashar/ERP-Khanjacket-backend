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
      const isWithoutStock = Boolean(outwardData.isWithoutStock);
      const articleNo = (outwardData.articleNo || 'DIRECT-SALE').toUpperCase().trim();
      const reqQty = Number(outwardData.quantity);

      // 1. Fetch Article or auto-register if missing (no strict stock blocking)
      let article = await Article.findByPk(articleNo, { transaction: t });
      if (!article) {
        article = await Article.create({
          articleNo,
          name: outwardData.articleName || (isWithoutStock ? 'Direct Sale (Bina Stock)' : `Garment ${articleNo}`),
          category: outwardData.category || 'General',
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
      const netBalanceAddition = totalSaleAmount - paidAmount;
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
        articleName: outwardData.articleName || article.name,
        category: outwardData.category || article.category,
        quantity: reqQty,
        city: outwardData.city || '',
        customerId: outwardData.customerId || null,
        destination: outwardData.destination.trim(),
        customerName: outwardData.customerName.trim(),
        customerPhone: outwardData.customerPhone || '',
        unitSalePrice,
        totalSaleAmount,
        gatePassNo,
        isWithoutStock,
        recordedBy: currentUser?.name || 'Staff',
        notes: outwardData.notes || ''
      }, { transaction: t });

      // 3. Update Inventory Stock tracking (only if normal With-Stock bill)
      if (!isWithoutStock) {
        await article.update({
          totalOut: (article.totalOut || 0) + reqQty,
          currentStock: (article.currentStock || 0) - reqQty
        }, { transaction: t });
      }

      // 4. Update Customer / Shopkeeper Khata (if customer matched or auto-create)
      let customerRecord = null;
      if (outwardData.customerId) {
        customerRecord = await Customer.findByPk(outwardData.customerId, { transaction: t });
      } else if (outwardData.customerName) {
        customerRecord = await Customer.findOne({
          where: { shopName: outwardData.customerName.trim() },
          transaction: t
        });
      }

      // If customer does not exist yet in db, auto-create customer so their khata is tracked
      if (!customerRecord && outwardData.customerName && outwardData.customerName.trim()) {
        const newCustId = `CUST-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
        customerRecord = await Customer.create({
          id: newCustId,
          shopName: outwardData.customerName.trim(),
          shopkeeperName: '',
          city: outwardData.city || 'Lahore',
          marketAddress: outwardData.destination || '',
          phone: outwardData.customerPhone || '',
          totalPiecesReceived: 0,
          totalBill: 0,
          totalPaid: 0,
          remainingBalance: 0
        }, { transaction: t });

        // Link outward record to new customer
        await newOutward.update({ customerId: customerRecord.id }, { transaction: t });
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

        await customerRecord.update({
          totalPiecesReceived: (customerRecord.totalPiecesReceived || 0) + (isWithoutStock ? 0 : reqQty),
          totalBill: Number(customerRecord.totalBill || 0) + totalSaleAmount,
          totalPaid: Number(customerRecord.totalPaid || 0) + paidAmount,
          remainingBalance: Number(customerRecord.remainingBalance || 0) + netBalanceAddition
        }, { transaction: t });
      }

      // 5. Update City Branch Mal counter (only for physical inventory dispatch)
      if (outwardData.city && !isWithoutStock) {
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
        action: isWithoutStock ? 'Direct Sale Billed (Without Stock)' : 'Stock Outward Dispatched',
        category: 'Warehouse Outward',
        details: isWithoutStock 
          ? `Direct Bill #${challanNo} of Rs. ${totalSaleAmount.toLocaleString()} (${newOutward.articleName}) to ${newOutward.customerName}`
          : `Dispatched ${reqQty} pcs of ${article.articleNo} to ${newOutward.customerName} (${newOutward.city || newOutward.destination})`,
        impact: isWithoutStock
          ? `Direct bill recorded without stock deduction. Customer balance increased by Rs. ${netBalanceAddition.toLocaleString()}`
          : `Stock reduced from ${article.currentStock} to ${article.currentStock - reqQty} pcs. Bill: Rs. ${totalSaleAmount.toLocaleString()}`,
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

  /**
   * Update Outward Dispatch and automatically reconcile stock and customer khata
   */
  static async updateOutward(id, data, currentUser) {
    const t = await sequelize.transaction();
    try {
      const outward = await Outward.findByPk(id, { transaction: t });
      if (!outward) {
        throw ApiError.notFound(`Outward dispatch "${id}" not found`);
      }

      const oldQty = Number(outward.quantity) || 0;
      const oldSalePrice = Number(outward.unitSalePrice) || 0;
      const oldBill = Number(outward.totalSaleAmount) || (oldQty * oldSalePrice);

      const newQty = data.quantity !== undefined && !isNaN(Number(data.quantity)) ? Math.max(1, Math.round(Number(data.quantity))) : oldQty;
      const newSalePrice = data.unitSalePrice !== undefined && !isNaN(Number(data.unitSalePrice)) ? Math.max(0, Number(data.unitSalePrice)) : oldSalePrice;
      const newBill = newQty * newSalePrice;
      const qtyDiff = newQty - oldQty;
      const billDiff = newBill - oldBill;

      // 1. Reconcile Article Stock (skip if without stock bill)
      if (outward.articleNo && qtyDiff !== 0 && !outward.isWithoutStock) {
        const article = await Article.findOne({ where: { articleNo: outward.articleNo }, transaction: t });
        if (article) {
          await article.update({
            totalOut: Math.max(0, (article.totalOut || 0) + qtyDiff),
            currentStock: (article.currentStock || 0) - qtyDiff
          }, { transaction: t });
        }
      }

      // 2. Reconcile City totalMalSent
      if (outward.city && qtyDiff !== 0) {
        const cityRecord = await City.findOne({ where: { name: outward.city }, transaction: t });
        if (cityRecord) {
          await cityRecord.update({
            totalMalSent: Math.max(0, (cityRecord.totalMalSent || 0) + qtyDiff)
          }, { transaction: t });
        }
      }

      // 3. Reconcile Customer Khata
      if (outward.customerId && (qtyDiff !== 0 || billDiff !== 0)) {
        const customer = await Customer.findByPk(outward.customerId, { transaction: t });
        if (customer) {
          await customer.update({
            totalPiecesReceived: Math.max(0, (customer.totalPiecesReceived || 0) + qtyDiff),
            totalBill: Math.max(0, Number(customer.totalBill || 0) + billDiff),
            remainingBalance: Number(customer.remainingBalance || 0) + billDiff
          }, { transaction: t });
        }
      }

      const updates = {};
      if (data.date) updates.date = data.date;
      if (data.challanNo) updates.challanNo = data.challanNo;
      if (data.gatePassNo !== undefined) updates.gatePassNo = data.gatePassNo;
      if (data.destination !== undefined) updates.destination = data.destination;
      if (data.notes !== undefined) updates.notes = data.notes;
      if (data.quantity !== undefined) updates.quantity = newQty;
      if (data.unitSalePrice !== undefined) updates.unitSalePrice = newSalePrice;
      if (data.quantity !== undefined || data.unitSalePrice !== undefined) updates.totalSaleAmount = newBill;

      await outward.update(updates, { transaction: t });

      await AuditService.log({
        action: 'Outward Dispatch Updated',
        category: 'Warehouse Outward',
        details: `Updated dispatch ${outward.challanNo} (${outward.articleNo}) - Qty: ${oldQty} -> ${newQty}, Rate: ${oldSalePrice} -> ${newSalePrice}`,
        impact: `Stock diff: ${-qtyDiff} pcs. Khata bill diff: Rs. ${billDiff.toLocaleString()}`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return outward;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Delete Outward Dispatch and revert inventory & customer khata
   */
  static async deleteOutward(id, currentUser) {
    const t = await sequelize.transaction();
    try {
      const outward = await Outward.findByPk(id, { transaction: t });
      if (!outward) {
        throw ApiError.notFound(`Outward dispatch "${id}" not found`);
      }

      const qty = Number(outward.quantity) || 0;
      const billAmt = Number(outward.totalSaleAmount) || 0;

      // 1. Revert Article inventory stock (skip if without stock bill)
      if (outward.articleNo && qty > 0 && !outward.isWithoutStock) {
        const article = await Article.findByPk(outward.articleNo, { transaction: t });
        if (article) {
          await article.update({
            totalOut: Math.max(0, (article.totalOut || 0) - qty),
            currentStock: (article.currentStock || 0) + qty
          }, { transaction: t });
        }
      }

      // 2. Revert City branch counter
      if (outward.city && qty > 0) {
        const cityRecord = await City.findOne({ where: { name: outward.city }, transaction: t });
        if (cityRecord) {
          await cityRecord.update({
            totalMalSent: Math.max(0, (cityRecord.totalMalSent || 0) - qty)
          }, { transaction: t });
        }
      }

      // 3. Revert Customer Khata
      if (outward.customerId) {
        const customer = await Customer.findByPk(outward.customerId, { transaction: t });
        if (customer) {
          await customer.update({
            totalPiecesReceived: Math.max(0, (customer.totalPiecesReceived || 0) - qty),
            totalBill: Math.max(0, Number(customer.totalBill || 0) - billAmt),
            remainingBalance: Number(customer.remainingBalance || 0) - billAmt
          }, { transaction: t });
        }
      }

      // 4. Destroy record
      await outward.destroy({ transaction: t });

      // 5. Audit Log
      await AuditService.log({
        action: 'Outward Dispatch Deleted',
        category: 'Warehouse Outward',
        details: `Deleted Challan #${outward.challanNo} (${qty} pcs of ${outward.articleNo})`,
        impact: `Restored ${qty} pcs to inventory. Customer bill reduced by Rs. ${billAmt.toLocaleString()}`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return { success: true, message: 'Outward dispatch deleted and stock reverted' };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = OutwardService;
