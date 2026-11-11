const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContainerClearance = sequelize.define('ContainerClearance', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  invoiceNo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: '1110'
  },
  clearingAgent: {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: 'BARCA TRADERS'
  },
  consignee: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: 'GUL TRADER'
  },
  party: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: 'TOOR HAJI'
  },
  agency: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: 'ABASEEN'
  },
  port: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'AKDP'
  },
  weight: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '22 MT'
  },
  containerSize: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '40 FT'
  },
  gdNo: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '1610'
  },
  blNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '026F533603'
  },
  containerNumber: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  openDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  goDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  billDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  purchaseId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: 'purchases',
      key: 'id'
    }
  },

  // Itemized Charges
  customDuty: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  shippingLineCharges: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  portPayment: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  clearanceCharges: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  consigneeCharges: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  dryPortExpenses: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  serviceCharges: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  agencyFee: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  insCharges: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  roadTransport: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  driver: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  craneLabour: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  railway: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  otherExpenses: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },

  // Calculated Totals
  totalDutyAmount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  totalExpenses: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  grandTotal: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  paidAmount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  paymentStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'Unpaid' // 'Paid' | 'Partial' | 'Unpaid'
  },
  contactPhone: {
    type: DataTypes.STRING(100),
    defaultValue: '03349191961'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'container_clearances',
  timestamps: true,
  indexes: [
    { fields: ['containerNumber'] },
    { fields: ['invoiceNo'] },
    { fields: ['billDate'] }
  ]
});

module.exports = ContainerClearance;

