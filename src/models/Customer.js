const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  shopName: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  shopkeeperName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  marketAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  totalPiecesReceived: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalBill: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  totalPaid: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  remainingBalance: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'customers',
  timestamps: true
});

module.exports = Customer;
