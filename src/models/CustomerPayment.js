const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomerPayment = sequelize.define('CustomerPayment', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  customerId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  customerName: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
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
    defaultValue: 'Cash Receipt'
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
    allowNull: true
  }
}, {
  tableName: 'customer_payments',
  timestamps: true
});

module.exports = CustomerPayment;
