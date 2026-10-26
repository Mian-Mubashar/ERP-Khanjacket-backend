const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Outward = sequelize.define('Outward', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  challanNo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
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
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  customerId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  destination: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  customerName: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  customerPhone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  unitSalePrice: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  totalSaleAmount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  gatePassNo: {
    type: DataTypes.STRING(50),
    allowNull: true
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
  tableName: 'outward_dispatches',
  timestamps: true
});

module.exports = Outward;
