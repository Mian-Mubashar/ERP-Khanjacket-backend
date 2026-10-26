const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  company: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  openingBalance: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  totalPurchases: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  totalPayments: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  remainingBalance: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'PKR'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'suppliers',
  timestamps: true
});

module.exports = Supplier;
