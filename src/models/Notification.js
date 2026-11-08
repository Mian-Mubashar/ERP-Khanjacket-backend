const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'SYSTEM',
    comment: 'WASOOLI, BILL, STOCK_ALERT, CUSTOMER_DUE, SYSTEM'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  referenceId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  customerName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  urgency: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'normal',
    comment: 'info, low, warning, critical, success'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['createdAt'] },
    { fields: ['type'] },
    { fields: ['isRead'] }
  ]
});

module.exports = Notification;

