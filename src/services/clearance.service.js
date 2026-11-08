const { ContainerClearance, Purchase } = require('../models');
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
    const dryPortExpenses = Number(data.dryPortExpenses) || 0;
    const serviceCharges = Number(data.serviceCharges) || 0;
    const agencyFee = Number(data.agencyFee) || 0;
    const insCharges = Number(data.insCharges) || 0;
    const roadTransport = Number(data.roadTransport) || 0;
    const driver = Number(data.driver) || 0;
    const consigneeCharges = Number(data.consigneeCharges) || 0;
    const craneLabour = Number(data.craneLabour) || 0;
    const railway = Number(data.railway) || 0;
    const otherExpenses = Number(data.otherExpenses) || 0;

    const totalDutyAmount = customDuty;
    const totalExpenses = (
      dryPortExpenses + 
      serviceCharges + 
      agencyFee + 
      insCharges + 
      roadTransport + 
      driver + 
      consigneeCharges + 
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
      dryPortExpenses,
      serviceCharges,
      agencyFee,
      insCharges,
      roadTransport,
      driver,
      consigneeCharges,
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
      include: [{ model: Purchase, as: 'purchase' }]
    });
    if (!item) throw ApiError.notFound(`Clearance bill "${id}" not found`);
    return item;
  }

  /**
   * Update clearance bill
   */
  static async updateClearance(id, data, currentUser) {
    const clearance = await ContainerClearance.findByPk(id);
    if (!clearance) throw ApiError.notFound(`Clearance bill "${id}" not found`);

    const computed = this.computeTotals(data);

    await clearance.update({
      invoiceNo: data.invoiceNo ? String(data.invoiceNo).trim() : clearance.invoiceNo,
      clearingAgent: data.clearingAgent ? String(data.clearingAgent).trim() : clearance.clearingAgent,
      consignee: data.consignee !== undefined ? String(data.consignee).trim() : clearance.consignee,
      party: data.party !== undefined ? String(data.party).trim() : clearance.party,
      agency: data.agency !== undefined ? String(data.agency).trim() : clearance.agency,
      port: data.port !== undefined ? String(data.port).trim() : clearance.port,
      weight: data.weight !== undefined ? String(data.weight).trim() : clearance.weight,
      containerSize: data.containerSize !== undefined ? String(data.containerSize).trim() : clearance.containerSize,
      gdNo: data.gdNo !== undefined ? String(data.gdNo).trim() : clearance.gdNo,
      blNumber: data.blNumber !== undefined ? String(data.blNumber).trim() : clearance.blNumber,
      containerNumber: data.containerNumber ? String(data.containerNumber).trim() : clearance.containerNumber,
      openDate: data.openDate !== undefined ? data.openDate : clearance.openDate,
      goDate: data.goDate !== undefined ? data.goDate : clearance.goDate,
      billDate: data.billDate || clearance.billDate,
      purchaseId: data.purchaseId !== undefined ? data.purchaseId : clearance.purchaseId,
      ...computed,
      contactPhone: data.contactPhone !== undefined ? String(data.contactPhone).trim() : clearance.contactPhone,
      notes: data.notes !== undefined ? String(data.notes).trim() : clearance.notes
    });

    AuditService.log({
      action: 'Container Clearance Bill Updated',
      category: 'Import Clearing',
      details: `Updated Clearance Bill #${clearance.invoiceNo} (${clearance.containerNumber})`,
      impact: `Grand Total: Rs. ${computed.grandTotal.toLocaleString()}`,
      user: currentUser
    }).catch(() => {});

    return clearance;
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
