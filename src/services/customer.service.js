const { sequelize, Customer, CustomerPayment, Outward, City } = require('../models');
const ApiError = require('../utils/apiError');
const AuditService = require('./audit.service');

class CustomerService {
  /**
   * List all wholesale customers & shopkeepers
   */
  static async listCustomers({ search, city }) {
    const { Op } = require('sequelize');
    const where = {};

    if (city) where.city = city;

    if (search) {
      where[Op.or] = [
        { shopName: { [Op.like]: `%${search}%` } },
        { shopkeeperName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { id: { [Op.like]: `%${search}%` } }
      ];
    }

    return await Customer.findAll({
      where,
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Get single customer with ledger history
   */
  static async getCustomerById(id) {
    const customer = await Customer.findByPk(id, {
      include: [
        { model: Outward, as: 'dispatches', limit: 20, order: [['date', 'DESC']] },
        { model: CustomerPayment, as: 'payments', limit: 20, order: [['date', 'DESC']] }
      ]
    });

    if (!customer) {
      throw ApiError.notFound(`Customer with ID "${id}" not found`);
    }

    return customer;
  }

  /**
   * Create new wholesale customer
   */
  static async createCustomer(custData, currentUser) {
    const count = await Customer.count();
    const newId = `CUST-${String(count + 101)}`;
    const opening = Number(custData.openingBalance) || 0;

    const newCustomer = await Customer.create({
      id: newId,
      shopName: custData.shopName.trim(),
      shopkeeperName: custData.shopkeeperName?.trim() || custData.shopName.trim(),
      city: custData.city.trim(),
      marketAddress: custData.marketAddress?.trim() || '',
      phone: custData.phone?.trim() || '',
      totalPiecesReceived: 0,
      totalBill: opening,
      totalPaid: 0,
      remainingBalance: opening,
      notes: custData.notes || ''
    });

    // Increment City shops counter
    const cityRecord = await City.findOne({ where: { name: newCustomer.city } });
    if (cityRecord) {
      await cityRecord.update({ totalShops: (cityRecord.totalShops || 0) + 1 });
    }

    await AuditService.log({
      action: 'Shopkeeper Registered',
      category: 'Wholesale Customers',
      details: `Added shop ${newCustomer.shopName} (${newCustomer.shopkeeperName}) in ${newCustomer.city}`,
      impact: `Opening Khata Balance: Rs. ${opening.toLocaleString()}`,
      user: currentUser
    });

    return newCustomer;
  }

  /**
   * Update customer
   */
  static async updateCustomer(id, data, currentUser) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw ApiError.notFound(`Customer "${id}" not found`);
    }

    const oldCity = customer.city;
    const oldShopName = customer.shopName;

    await customer.update(data);

    // If city changed, update city shops counter
    if (data.city && data.city !== oldCity) {
      const oldCityRecord = await City.findOne({ where: { name: oldCity } });
      if (oldCityRecord && oldCityRecord.totalShops > 0) {
        await oldCityRecord.update({ totalShops: oldCityRecord.totalShops - 1 });
      }
      const newCityRecord = await City.findOne({ where: { name: data.city } });
      if (newCityRecord) {
        await newCityRecord.update({ totalShops: (newCityRecord.totalShops || 0) + 1 });
      }
    }

    // Sync outward & payments denormalized names if shopName or city or phone changed
    if (data.shopName || data.phone || data.city) {
      const { Outward, CustomerPayment } = require('../models');
      const outwardUpdates = {};
      if (data.shopName) outwardUpdates.customerName = data.shopName;
      if (data.phone) outwardUpdates.customerPhone = data.phone;
      if (data.city) {
        outwardUpdates.city = data.city;
        outwardUpdates.destination = data.city;
      }
      await Outward.update(outwardUpdates, { where: { customerId: id } });

      const paymentUpdates = {};
      if (data.shopName) paymentUpdates.customerName = data.shopName;
      if (data.city) paymentUpdates.city = data.city;
      await CustomerPayment.update(paymentUpdates, { where: { customerId: id } });
    }

    await AuditService.log({
      action: 'Customer Updated',
      category: 'Wholesale Customers',
      details: `Updated details for customer ${id} (${customer.shopName})`,
      impact: 'Khata profile & references synchronized',
      user: currentUser
    });

    return customer;
  }

  /**
   * Delete customer
   */
  static async deleteCustomer(id, currentUser) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw ApiError.notFound(`Customer "${id}" not found`);
    }

    if (customer.remainingBalance !== 0) {
      throw ApiError.badRequest(`Cannot delete customer with pending khata balance (Rs. ${customer.remainingBalance}). Clear balance first.`);
    }

    await customer.destroy();

    await AuditService.log({
      action: 'Customer Deleted',
      category: 'Wholesale Customers',
      details: `Deleted customer record ${id} (${customer.shopName})`,
      impact: 'Removed from khata registry',
      user: currentUser
    });

    return { message: `Customer ${id} deleted successfully` };
  }

  /**
   * Record Customer payment receipt (Transactional)
   */
  static async recordPayment(paymentData, currentUser) {
    const t = await sequelize.transaction();

    try {
      const customer = await Customer.findByPk(paymentData.customerId, { transaction: t });
      if (!customer) {
        throw ApiError.notFound('Customer not found');
      }

      const payAmt = Number(paymentData.amount);
      const newPayId = `CPAY-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
      const date = paymentData.date || new Date().toISOString().split('T')[0];
      const method = paymentData.paymentMethod || 'Cash Receipt';
      const refNo = paymentData.refNo || `REC-${Date.now().toString().slice(-4)}`;

      // 1. Create CustomerPayment
      const newPayment = await CustomerPayment.create({
        id: newPayId,
        customerId: customer.id,
        customerName: `${customer.shopName} (${customer.shopkeeperName || ''})`,
        city: customer.city,
        date,
        amount: payAmt,
        paymentMethod: method,
        refNo,
        notes: paymentData.notes || '',
        recordedBy: currentUser?.name || 'Admin'
      }, { transaction: t });

      // 2. Update Customer Khata
      const prevBal = Number(customer.remainingBalance);
      await customer.update({
        totalPaid: Number(customer.totalPaid || 0) + payAmt,
        remainingBalance: prevBal - payAmt
      }, { transaction: t });

      // 3. Record Audit Log
      await AuditService.log({
        action: 'Customer Payment Received',
        category: 'Customer Khata',
        details: `Received Rs. ${payAmt.toLocaleString()} from ${customer.shopName} (${customer.city}) via ${method}`,
        impact: `Remaining Khata reduced from Rs. ${prevBal.toLocaleString()} to Rs. ${(prevBal - payAmt).toLocaleString()}`,
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
   * List all customer payment receipts
   */
  static async listPayments({ customerId }) {
    const where = {};
    if (customerId) where.customerId = customerId;

    return await CustomerPayment.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
  }
}

module.exports = CustomerService;
