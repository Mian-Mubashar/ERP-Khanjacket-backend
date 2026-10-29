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
}

module.exports = SupplierService;
