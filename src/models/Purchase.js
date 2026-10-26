const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  invoiceNo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  supplierId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  supplierName: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  containerNo: {
    type: DataTypes.STRING(100),
    defaultValue: 'N/A'
  },
  itemsSubtotal: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  extraExpenses: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  expenseNote: {
    type: DataTypes.STRING(255),
    defaultValue: 'Freight & Clearing'
  },
  totalBill: {
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
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Received in Warehouse'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'purchases',
  timestamps: true
});

module.exports = Purchase;
