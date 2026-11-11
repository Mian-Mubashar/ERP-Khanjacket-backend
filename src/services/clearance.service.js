const { ContainerClearance, Purchase, ClearancePayment } = require('../models');
const AuditService = require('./audit.service');
const NotificationService = require('./notification.service');
const ApiError = require('../utils/apiError');
const { Op } = require('sequelize');

class ClearanceService {
  /**
   * Calculate totals helper
   */
  static computeTotals(data) {
    const customDuty = Number(data.customDuty) || 0;
    const shippingLineCharges = Number(data.shippingLineCharges) || 0;
    const portPayment = Number(data.portPayment) || 0;
    const clearanceCharges = Number(data.clearanceCharges) || 0;
    const consigneeCharges = Number(data.consigneeCharges) || 0;
    const dryPortExpenses = Number(data.dryPortExpenses) || 0;
    const serviceCharges = Number(data.serviceCharges) || 0;
    const agencyFee = Number(data.agencyFee) || 0;
    const insCharges = Number(data.insCharges) || 0;
    const roadTransport = Number(data.roadTransport) || 0;
    const driver = Number(data.driver) || 0;
    const craneLabour = Number(data.craneLabour) || 0;
    const railway = Number(data.railway) || 0;
    const otherExpenses = Number(data.otherExpenses) || 0;

    const totalDutyAmount = customDuty;
    const totalExpenses = (
      shippingLineCharges +
      portPayment +
      clearanceCharges +
      consigneeCharges +
      dryPortExpenses + 
      serviceCharges + 
      agencyFee + 
      insCharges + 
      roadTransport + 
      driver + 
      craneLabour + 
      railway + 
      otherExpenses
    );

    const grandTotal = totalDutyAmount + totalExpenses;
    const paidAmount = Number(data.paidAmount) || 0;
    const remainingAmount = Math.max(0, grandTotal - paidAmount);

    let paymentStatus = 'Unpaid';
    if (remainingAmount <= 0 && grandTotal > 0) {
      paymentStatus = 'Paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'Partial';
    }

    return {
      customDuty,
      shippingLineCharges,
      portPayment,
      clearanceCharges,
      consigneeCharges,
      dryPortExpenses,
      serviceCharges,
      agencyFee,
      insCharges,
      roadTransport,
      driver,
      craneLabour,
      railway,
      otherExpenses,
      totalDutyAmount,
      totalExpenses,
      grandTotal,
      paidAmount,
      remainingAmount,
      paymentStatus
    };
  }

  /**
   * Create new Container Duty & Clearance Bill
   */
  static async createClearance(data, currentUser) {
    const computed = this.computeTotals(data);
    const id = `CLR-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

    const clearance = await ContainerClearance.create({
      id,
      invoiceNo: (data.invoiceNo || '1110').trim(),
      clearingAgent: (data.clearingAgent || 'BARCA TRADERS').trim(),
      consignee: (data.consignee || 'GUL TRADER').trim(),
      party: (data.party || 'TOOR HAJI').trim(),
      agency: (data.agency || 'ABASEEN').trim(),
      port: (data.port || 'AKDP').trim(),
      weight: (data.weight || '22 MT').trim(),
      containerSize: (data.containerSize || '40 FT').trim(),
      gdNo: (data.gdNo || '1610').trim(),
      blNumber: (data.blNumber || '026F533603').trim(),
      containerNumber: (data.containerNumber || 'BMOU4084980').trim(),
      openDate: data.openDate || null,
      goDate: data.goDate || null,
      billDate: data.billDate || new Date().toISOString().split('T')[0],
      purchaseId: data.purchaseId || null,
      ...computed,
      contactPhone: (data.contactPhone || '03349191961').trim(),
      notes: (data.notes || '').trim()
    });

    // If attached to a China Purchase, update its extraExpenses if requested
    if (data.purchaseId && data.applyToPurchaseCost) {
      try {
        const purchase = await Purchase.findByPk(data.purchaseId);
        if (purchase) {
          const newExpenses = Number(purchase.extraExpenses || 0) + computed.totalExpenses;
          const newTotalBill = Number(purchase.itemsSubtotal || 0) + newExpenses;
          const newRemaining = newTotalBill - Number(purchase.paidAmount || 0);
          await purchase.update({
            extraExpenses: newExpenses,
            totalBill: newTotalBill,
            remainingAmount: newRemaining,
            expenseNote: `Clearing: ${clearance.clearingAgent} (Inv #${clearance.invoiceNo})`
          });
        }
      } catch (pErr) {
        console.warn('[ClearanceService] Link to purchase update warning:', pErr.message);
      }
    }

    // If initial paid amount was provided, record initial payment in payments ledger
    if (computed.paidAmount > 0) {
      try {
        await ClearancePayment.create({
          id: `CPAY-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
          clearanceId: id,
          clearingAgent: clearance.clearingAgent,
          date: clearance.billDate,
          amount: computed.paidAmount,
          paymentMethod: 'Bank Transfer / Initial Advance',
          refNo: `ADV-${clearance.invoiceNo}`,
          notes: 'Initial clearing advance payment',
          recordedBy: currentUser?.name || 'Admin Khan'
        });
      } catch (err) {
        console.error('Failed to create initial clearance payment:', err);
      }
    }

    // Audit Log
    AuditService.log({
      action: 'Container Clearance Bill Created',
      category: 'Import Clearing',
      details: `Clearance Bill #${clearance.invoiceNo} (${clearance.clearingAgent}) recorded for Container #${clearance.containerNumber}. Total: Rs. ${computed.grandTotal.toLocaleString()}`,
      impact: `Duty: Rs. ${computed.totalDutyAmount.toLocaleString()}, Port Expenses: Rs. ${computed.totalExpenses.toLocaleString()}`,
      user: currentUser
    }).catch(() => {});

    // Notification
    NotificationService.createNotification({
      type: 'BILL',
      title: `Container Clearance: ${clearance.clearingAgent} (Inv #${clearance.invoiceNo})`,
      message: `Container #${clearance.containerNumber} clearance bill recorded. Total: Rs. ${computed.grandTotal.toLocaleString()}`,
      category: 'Import Clearing',
      referenceId: clearance.invoiceNo,
      city: clearance.port || 'AKDP',
      amount: computed.grandTotal,
      urgency: 'info'
    }).catch(() => {});

    return clearance;
  }

  /**
   * List all clearances with search and pagination
   */
  static async listClearances({ search, status, page = 1, limit = 50 } = {}) {
    const where = {};

    if (status && status !== 'ALL') {
      where.paymentStatus = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { invoiceNo: { [Op.like]: `%${q}%` } },
        { containerNumber: { [Op.like]: `%${q}%` } },
        { clearingAgent: { [Op.like]: `%${q}%` } },
        { consignee: { [Op.like]: `%${q}%` } },
        { party: { [Op.like]: `%${q}%` } },
        { blNumber: { [Op.like]: `%${q}%` } },
        { gdNo: { [Op.like]: `%${q}%` } }
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    return await ContainerClearance.findAll({
      where,
      include: [
        { model: Purchase, as: 'purchase' },
        { model: ClearancePayment, as: 'payments' }
      ],
      order: [['billDate', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });
  }

  /**
   * Get single clearance bill
   */
  static async getClearanceById(id) {
    const item = await ContainerClearance.findByPk(id, {
      include: [
        { model: Purchase, as: 'purchase' },
        { model: ClearancePayment, as: 'payments' }
      ]
    });
    if (!item) throw ApiError.notFound(`Clearance bill "${id}" not found`);
    return item;
  }

  /**
   * Record a payment (Adaigi) against a Container Clearance Bill
   */
  static async recordPayment(clearanceId, data, currentUser) {
    const clearance = await ContainerClearance.findByPk(clearanceId);
    if (!clearance) throw ApiError.notFound(`Clearance bill "${clearanceId}" not found`);

    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw ApiError.badRequest('Payment amount must be greater than 0');
    }

    const paymentId = `CPAY-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

    const payment = await ClearancePayment.create({
      id: paymentId,
      clearanceId,
      clearingAgent: clearance.clearingAgent,
      date: data.date || new Date().toISOString().split('T')[0],
      amount,
      paymentMethod: data.paymentMethod || 'Bank Transfer / Wire',
      refNo: data.refNo ? String(data.refNo).trim() : null,
      notes: data.notes ? String(data.notes).trim() : null,
      recordedBy: currentUser?.name || 'Admin Khan'
    });

    // Recalculate total payments made for this clearance
    const allPayments = await ClearancePayment.findAll({ where: { clearanceId } });
    const totalPaid = allPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const grandTotal = Number(clearance.grandTotal) || 0;
    const remainingAmount = Math.max(0, grandTotal - totalPaid);
    const paymentStatus = remainingAmount <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');

    await clearance.update({
      paidAmount: totalPaid,
      remainingAmount,
      paymentStatus
    });

    AuditService.log({
      action: 'Clearance Payment Recorded',
      category: 'Import Clearing Khata',
      details: `Paid Rs. ${amount.toLocaleString()} to ${clearance.clearingAgent} for Bill #${clearance.invoiceNo} (Container: ${clearance.containerNumber})`,
      impact: `New Baqaya: Rs. ${remainingAmount.toLocaleString()}`,
      user: currentUser
    }).catch(() => {});

    NotificationService.createNotification({
      type: 'PAYMENT',
      category: 'WASOOLI',
      title: 'Clearance Payment Paid',
      message: `Paid Rs. ${amount.toLocaleString()} to ${clearance.clearingAgent} against Inv #${clearance.invoiceNo}. Remaining Due: Rs. ${remainingAmount.toLocaleString()}`,
      referenceId: clearance.id,
      amount
    }).catch(() => {});

    // Return updated clearance with payments
    const updated = await this.getClearanceById(clearanceId);
    return { payment, clearance: updated };
  }

  /**
   * Get payments history for a clearance bill
   */
  static async getPayments(clearanceId) {
    const clearance = await ContainerClearance.findByPk(clearanceId);
    if (!clearance) throw ApiError.notFound(`Clearance bill "${clearanceId}" not found`);

    return await ClearancePayment.findAll({
      where: { clearanceId },
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
  }

  /**
   * Delete a clearance payment entry
   */
  static async deletePayment(paymentId, currentUser) {
    const payment = await ClearancePayment.findByPk(paymentId);
    if (!payment) throw ApiError.notFound(`Payment "${paymentId}" not found`);

    const clearanceId = payment.clearanceId;
    const clearance = await ContainerClearance.findByPk(clearanceId);
    const deletedAmount = Number(payment.amount) || 0;

    await payment.destroy();

    // Recalculate totals
    if (clearance) {
      const allPayments = await ClearancePayment.findAll({ where: { clearanceId } });
      const totalPaid = allPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const grandTotal = Number(clearance.grandTotal) || 0;
      const remainingAmount = Math.max(0, grandTotal - totalPaid);
      const paymentStatus = remainingAmount <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');

      await clearance.update({
        paidAmount: totalPaid,
        remainingAmount,
        paymentStatus
      });
    }

    AuditService.log({
      action: 'Clearance Payment Deleted',
      category: 'Import Clearing Khata',
      details: `Reverted payment of Rs. ${deletedAmount.toLocaleString()} for Clearance #${clearance?.invoiceNo || clearanceId}`,
      user: currentUser
    }).catch(() => {});

    const updated = clearance ? await this.getClearanceById(clearanceId) : null;
    return { success: true, clearance: updated };
  }

  /**
   * Update a clearance payment entry
   */
  static async updatePayment(paymentId, data, currentUser) {
    const payment = await ClearancePayment.findByPk(paymentId);
    if (!payment) throw ApiError.notFound(`Payment "${paymentId}" not found`);

    const clearanceId = payment.clearanceId;
    const clearance = await ContainerClearance.findByPk(clearanceId);
    const oldAmount = Number(payment.amount) || 0;
    const newAmount = data.amount !== undefined ? Math.max(0, Number(data.amount) || 0) : oldAmount;

    await payment.update({
      amount: newAmount,
      date: data.date || payment.date,
      paymentMethod: data.paymentMethod || payment.paymentMethod,
      refNo: data.refNo !== undefined ? data.refNo : payment.refNo,
      notes: data.notes !== undefined ? data.notes : payment.notes
    });

    // Recalculate totals
    if (clearance) {
      const allPayments = await ClearancePayment.findAll({ where: { clearanceId } });
      const totalPaid = allPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const grandTotal = Number(clearance.grandTotal) || 0;
      const remainingAmount = Math.max(0, grandTotal - totalPaid);
      const paymentStatus = remainingAmount <= 0 && grandTotal > 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');

      await clearance.update({
        paidAmount: totalPaid,
        remainingAmount,
        paymentStatus
      });
    }

    AuditService.log({
      action: 'Clearance Payment Updated',
      category: 'Import Clearing Khata',
      details: `Updated payment of Rs. ${newAmount.toLocaleString()} (was Rs. ${oldAmount.toLocaleString()}) for Clearance #${clearance?.invoiceNo || clearanceId}`,
      user: currentUser
    }).catch(() => {});

    const updated = clearance ? await this.getClearanceById(clearanceId) : null;
    return { success: true, payment, clearance: updated };
  }

  /**
   * Update clearance bill
   */
  static async updateClearance(id, data, currentUser) {
    const clearance = await ContainerClearance.findByPk(id);
    if (!clearance) throw ApiError.notFound(`Clearance bill "${id}" not found`);

    const computed = this.computeTotals(data);

    // Target paid amount entered by the user
    const targetPaidAmount = data.paidAmount !== undefined 
      ? Math.max(0, Number(data.paidAmount) || 0) 
      : (Number(clearance.paidAmount) || 0);

    const remainingAmount = Math.max(0, computed.grandTotal - targetPaidAmount);
    const paymentStatus = remainingAmount <= 0 && computed.grandTotal > 0 
      ? 'Paid' 
      : (targetPaidAmount > 0 ? 'Partial' : 'Unpaid');

    const currentAgent = data.clearingAgent ? String(data.clearingAgent).trim() : clearance.clearingAgent;
    const billDate = data.billDate || clearance.billDate;

    // Handle ClearancePayment ledger synchronization
    const existingPayments = await ClearancePayment.findAll({ where: { clearanceId: id } });

    if (existingPayments.length === 0) {
      if (targetPaidAmount > 0) {
        await ClearancePayment.create({
          id: `CPAY-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
          clearanceId: id,
          clearingAgent: currentAgent,
          date: billDate,
          amount: targetPaidAmount,
          paymentMethod: 'Bank Transfer / Initial Advance',
          refNo: `ADV-${data.invoiceNo ? String(data.invoiceNo).trim() : clearance.invoiceNo}`,
          notes: 'Initial clearing advance payment',
          recordedBy: currentUser?.name || 'Admin Khan'
        });
      }
    } else if (existingPayments.length === 1) {
      if (targetPaidAmount > 0) {
        await existingPayments[0].update({
          amount: targetPaidAmount,
          clearingAgent: currentAgent,
          date: billDate
        });
      } else {
        await existingPayments[0].destroy();
      }
    } else {
      // Multiple payment installments in ledger
      const ledgerPaid = existingPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const delta = targetPaidAmount - ledgerPaid;

      // Keep clearingAgent in sync across all payments
      if (currentAgent !== clearance.clearingAgent) {
        await ClearancePayment.update(
          { clearingAgent: currentAgent },
          { where: { clearanceId: id } }
        );
      }

      if (delta !== 0) {
        const advPayment = existingPayments.find(p => p.refNo?.startsWith('ADV-')) || existingPayments[0];
        if (advPayment && (Number(advPayment.amount) + delta) >= 0) {
          await advPayment.update({
            amount: Number(advPayment.amount) + delta,
            clearingAgent: currentAgent
          });
        } else if (delta > 0) {
          await ClearancePayment.create({
            id: `CPAY-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
            clearanceId: id,
            clearingAgent: currentAgent,
            date: billDate,
            amount: delta,
            paymentMethod: 'Bank Transfer / Adjustment',
            refNo: `ADJ-${data.invoiceNo ? String(data.invoiceNo).trim() : clearance.invoiceNo}`,
            notes: 'Payment adjustment on bill edit',
            recordedBy: currentUser?.name || 'Admin Khan'
          });
        }
      }
    }

    // Clean foreign keys and date values
    const purchaseId = data.purchaseId && String(data.purchaseId).trim() ? String(data.purchaseId).trim() : null;
    const openDate = data.openDate && String(data.openDate).trim() ? data.openDate : null;
    const goDate = data.goDate && String(data.goDate).trim() ? data.goDate : null;

    const oldTotalExpenses = Number(clearance.totalExpenses || 0);

    await clearance.update({
      invoiceNo: data.invoiceNo ? String(data.invoiceNo).trim() : clearance.invoiceNo,
      clearingAgent: currentAgent,
      consignee: data.consignee !== undefined ? String(data.consignee).trim() : clearance.consignee,
      party: data.party !== undefined ? String(data.party).trim() : clearance.party,
      agency: data.agency !== undefined ? String(data.agency).trim() : clearance.agency,
      port: data.port !== undefined ? String(data.port).trim() : clearance.port,
      weight: data.weight !== undefined ? String(data.weight).trim() : clearance.weight,
      containerSize: data.containerSize !== undefined ? String(data.containerSize).trim() : clearance.containerSize,
      gdNo: data.gdNo !== undefined ? String(data.gdNo).trim() : clearance.gdNo,
      blNumber: data.blNumber !== undefined ? String(data.blNumber).trim() : clearance.blNumber,
      containerNumber: data.containerNumber ? String(data.containerNumber).trim() : clearance.containerNumber,
      openDate,
      goDate,
      billDate,
      purchaseId,
      ...computed,
      paidAmount: targetPaidAmount,
      remainingAmount,
      paymentStatus,
      contactPhone: data.contactPhone !== undefined ? String(data.contactPhone).trim() : clearance.contactPhone,
      notes: data.notes !== undefined ? String(data.notes).trim() : clearance.notes
    });

    // Update linked China purchase if applicable
    if (purchaseId && data.applyToPurchaseCost) {
      try {
        const purchase = await Purchase.findByPk(purchaseId);
        if (purchase) {
          const deltaExpenses = computed.totalExpenses - oldTotalExpenses;
          const newExpenses = Math.max(0, Number(purchase.extraExpenses || 0) + deltaExpenses);
          const newTotalBill = Number(purchase.itemsSubtotal || 0) + newExpenses;
          const newRemaining = newTotalBill - Number(purchase.paidAmount || 0);
          await purchase.update({
            extraExpenses: newExpenses,
            totalBill: newTotalBill,
            remainingAmount: newRemaining,
            expenseNote: `Clearing: ${clearance.clearingAgent} (Inv #${clearance.invoiceNo})`
          });
        }
      } catch (pErr) {
        console.warn('[ClearanceService] Link to purchase update warning:', pErr.message);
      }
    }

    AuditService.log({
      action: 'Container Clearance Bill Updated',
      category: 'Import Clearing',
      details: `Updated Clearance Bill #${clearance.invoiceNo} (${clearance.containerNumber})`,
      impact: `Grand Total: Rs. ${computed.grandTotal.toLocaleString()} | Paid: Rs. ${targetPaidAmount.toLocaleString()} | Due: Rs. ${remainingAmount.toLocaleString()}`,
      user: currentUser
    }).catch(() => {});

    return await this.getClearanceById(id);
  }

  /**
   * Delete clearance bill
   */
  static async deleteClearance(id, currentUser) {
    const clearance = await ContainerClearance.findByPk(id);
    if (!clearance) throw ApiError.notFound(`Clearance bill "${id}" not found`);

    const invoiceNo = clearance.invoiceNo;
    const containerNumber = clearance.containerNumber;

    await clearance.destroy();

    AuditService.log({
      action: 'Container Clearance Bill Deleted',
      category: 'Import Clearing',
      details: `Deleted Clearance Bill #${invoiceNo} (${containerNumber})`,
      user: currentUser
    }).catch(() => {});

    return { success: true, message: `Clearance bill #${invoiceNo} deleted successfully` };
  }
}

module.exports = ClearanceService;

