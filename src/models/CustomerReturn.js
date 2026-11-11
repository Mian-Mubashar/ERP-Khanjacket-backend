const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomerReturn = sequelize.define('CustomerReturn', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  returnSlipNo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  date: {
    type: DataTypes.DATEONLY,
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
  articleNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'articles',
      key: 'articleNo'
    }
  },
  articleName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unitPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0
  },
  reason: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: 'General Maal Wapsi'
  },
  restoreStock: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  recordedBy: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'customer_returns',
  timestamps: true
});

module.exports = CustomerReturn;

