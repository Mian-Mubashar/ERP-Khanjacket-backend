const { sequelize, Supplier, SupplierPayment, Purchase } = require('../models');
const ApiError = require('../utils/apiError');
const AuditService = require('./audit.service');

class SupplierService {
  /**
   * List all suppliers
   */
  static async listSuppliers({ search }) {
    const { Op } = require('sequelize');
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { id: { [Op.like]: `%${search}%` } }
      ];
    }

    return await Supplier.findAll({
      where,
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Get single supplier with payment history and purchases
   */
  static async getSupplierById(id) {
    const supplier = await Supplier.findByPk(id, {
      include: [
        { model: Purchase, as: 'purchases', limit: 10, order: [['purchaseDate', 'DESC']] },
        { model: SupplierPayment, as: 'payments', limit: 20, order: [['date', 'DESC']] }
      ]
    });

    if (!supplier) {
      throw ApiError.notFound(`Supplier with ID "${id}" not found`);
    }

    return supplier;
  }

  /**
   * Create new supplier
   */
  static async createSupplier(supplierData, currentUser) {
    const suppliers = await Supplier.findAll({ attributes: ['id'] });
    let maxNum = 0;
    suppliers.forEach(s => {
      const match = String(s.id).match(/^SUP-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    let newId = `SUP-${String(maxNum + 1).padStart(3, '0')}`;
    while (await Supplier.findByPk(newId)) {
      maxNum++;
      newId = `SUP-${String(maxNum + 1).padStart(3, '0')}`;
    }
    const opening = Number(supplierData.openingBalance) || 0;

    const newSupplier = await Supplier.create({
      id: newId,
      name: supplierData.name.trim(),
      company: supplierData.company.trim(),
      phone: supplierData.phone?.trim() || '',
      address: supplierData.address?.trim() || '',
      openingBalance: opening,
      totalPurchases: 0,
      totalPayments: 0,
      remainingBalance: opening,
      currency: supplierData.currency || 'PKR',
      notes: supplierData.notes || ''
    });

    await AuditService.log({
      action: 'Supplier Registered',
      category: 'Supplier Account',
      details: `Registered vendor: ${newSupplier.company} (${newSupplier.name})`,
      impact: `Opening balance: Rs. ${opening.toLocaleString()}`,
      user: currentUser
    });

    return newSupplier;
  }

  /**
   * Record Supplier TT / Wire payment (Transactional)
   */
  static async recordPayment(paymentData, currentUser) {
    const t = await sequelize.transaction();

    try {
      const supplier = await Supplier.findByPk(paymentData.supplierId, { transaction: t });
      if (!supplier) {
        throw ApiError.notFound('Supplier not found');
      }

      const payAmt = Number(paymentData.amount);
      const newPayId = `PAY-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
      const date = paymentData.date || new Date().toISOString().split('T')[0];
      const method = paymentData.paymentMethod || 'Bank TT / Wire Transfer';
      const refNo = paymentData.refNo || `REF-${Date.now().toString().slice(-4)}`;

      // 1. Create Payment Record
      const newPayment = await SupplierPayment.create({
        id: newPayId,
        supplierId: supplier.id,
        supplierName: supplier.name,
        date,
        amount: payAmt,
        paymentMethod: method,
        refNo,
        notes: paymentData.notes || '',
        recordedBy: currentUser?.name || 'Admin'
      }, { transaction: t });

      // 2. Update Supplier Balance
      const prevBal = Number(supplier.remainingBalance);
      await supplier.update({
        totalPayments: Number(supplier.totalPayments) + payAmt,
        remainingBalance: prevBal - payAmt
      }, { transaction: t });

      // 3. Record Audit
      await AuditService.log({
        action: 'Supplier Payment Recorded',
        category: 'Supplier Payment',
        details: `Paid Rs. ${payAmt.toLocaleString()} to ${supplier.company} (${method}, Ref: ${refNo})`,
        impact: `Remaining balance decreased from Rs. ${prevBal.toLocaleString()} to Rs. ${(prevBal - payAmt).toLocaleString()}`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return newPayment;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * List all supplier payments
   */
  static async listPayments({ supplierId }) {
    const where = {};
    if (supplierId) where.supplierId = supplierId;

    return await SupplierPayment.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
  }

  /**
   * Update Supplier details
   */
  static async updateSupplier(id, data, currentUser) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      throw ApiError.notFound(`Supplier "${id}" not found`);
    }

    await supplier.update(data);

    // If company or name changed, sync purchase and payment supplier names
    if (data.company || data.name) {
      const { Purchase, SupplierPayment } = require('../models');
      const displayName = data.company ? `${data.company} (${data.name || supplier.name})` : undefined;
      if (displayName) {
        await Purchase.update({ supplierName: displayName }, { where: { supplierId: id } });
      }
      if (data.name) {
        await SupplierPayment.update({ supplierName: data.name }, { where: { supplierId: id } });
      }
    }

    await AuditService.log({
      action: 'Supplier Updated',
      category: 'Supplier Account',
      details: `Updated vendor details for ${supplier.company} (${supplier.name})`,
      impact: 'Supplier profile modified',
      user: currentUser
    });

    return supplier;
  }

  /**
   * Update a specific supplier payment entry
   */
  static async updatePayment(id, data, currentUser) {
    const t = await sequelize.transaction();
    try {
      const payment = await SupplierPayment.findByPk(id, { transaction: t });
      if (!payment) {
        throw ApiError.notFound(`Payment "${id}" not found`);
      }

      const oldAmt = Number(payment.amount) || 0;
      const newAmt = data.amount !== undefined ? Number(data.amount) : oldAmt;
      const diff = newAmt - oldAmt;

      const supplier = await Supplier.findByPk(payment.supplierId, { transaction: t });
      if (supplier && diff !== 0) {
        await supplier.update({
          totalPayments: Number(supplier.totalPayments) + diff,
          remainingBalance: Number(supplier.remainingBalance) - diff
        }, { transaction: t });
      }

      await payment.update({
        date: data.date || payment.date,
        amount: newAmt,
        paymentMethod: data.paymentMethod || payment.paymentMethod,
        refNo: data.refNo || payment.refNo,
        notes: data.notes !== undefined ? data.notes : payment.notes
      }, { transaction: t });

      await AuditService.log({
        action: 'Supplier Payment Updated',
        category: 'Supplier Payment',
        details: `Updated payment ${payment.refNo} (Old: Rs. ${oldAmt.toLocaleString()}, New: Rs. ${newAmt.toLocaleString()})`,
        impact: `Supplier balance adjusted by Rs. ${(-diff).toLocaleString()}`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return payment;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Delete a specific supplier payment entry and revert balance
   */
  static async deletePayment(id, currentUser) {
    const t = await sequelize.transaction();
    try {
      const payment = await SupplierPayment.findByPk(id, { transaction: t });
      if (!payment) {
        throw ApiError.notFound(`Payment "${id}" not found`);
      }

      const payAmt = Number(payment.amount) || 0;
      const supplier = await Supplier.findByPk(payment.supplierId, { transaction: t });
      if (supplier) {
        await supplier.update({
          totalPayments: Math.max(0, Number(supplier.totalPayments) - payAmt),
          remainingBalance: Number(supplier.remainingBalance) + payAmt
        }, { transaction: t });
      }

      await payment.destroy({ transaction: t });

      await AuditService.log({
        action: 'Supplier Payment Deleted',
        category: 'Supplier Payment',
        details: `Deleted payment ${payment.refNo} (Rs. ${payAmt.toLocaleString()})`,
        impact: `Restored Rs. ${payAmt.toLocaleString()} to supplier balance`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return { success: true, message: 'Payment entry deleted successfully' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Delete supplier (Transactional with cascade of payments, purchase unlinking)
   */
  static async deleteSupplier(id, currentUser) {
    const t = await sequelize.transaction();
    try {
      const supplier = await Supplier.findByPk(id, { transaction: t });
      if (!supplier) {
        throw ApiError.notFound(`Supplier "${id}" not found`);
      }

      // 1. Delete associated supplier payments
      await SupplierPayment.destroy({ where: { supplierId: id }, transaction: t });

      // 2. Unlink purchases so stock/consignment records remain intact
      await Purchase.update({ supplierId: null }, { where: { supplierId: id }, transaction: t });

      // 3. Delete supplier
      await supplier.destroy({ transaction: t });

      // 4. Audit Log
      const prevBal = Number(supplier.remainingBalance || 0);
      await AuditService.log({
        action: 'Supplier Deleted',
        category: 'China Suppliers',
        details: `Deleted supplier record ${id} (${supplier.name} - ${supplier.company})`,
        impact: `Removed vendor profile. Unsettled balance was Rs. ${prevBal.toLocaleString()}`,
        user: currentUser,
        transaction: t
      });

      await t.commit();
      return { success: true, message: `Supplier "${supplier.name}" deleted successfully` };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = SupplierService;
