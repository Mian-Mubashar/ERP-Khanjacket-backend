const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupplierPayment = sequelize.define('SupplierPayment', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
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
    defaultValue: 'Bank TT / Wire Transfer'
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
  tableName: 'supplier_payments',
  timestamps: true
});

module.exports = SupplierPayment;
