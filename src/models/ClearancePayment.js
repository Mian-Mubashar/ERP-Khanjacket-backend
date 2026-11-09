const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClearancePayment = sequelize.define('ClearancePayment', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  clearanceId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'container_clearances',
      key: 'id'
    }
  },
  clearingAgent: {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: 'BARCA TRADERS'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING(100),
    defaultValue: 'Bank Transfer / Wire'
  },
  refNo: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recordedBy: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Admin Khan'
  }
}, {
  tableName: 'clearance_payments',
  timestamps: true,
  indexes: [
    { fields: ['clearanceId'] },
    { fields: ['date'] },
    { fields: ['clearingAgent'] }
  ]
});

module.exports = ClearancePayment;

