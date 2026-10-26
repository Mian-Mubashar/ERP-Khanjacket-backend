const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseItem = sequelize.define('PurchaseItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  purchaseId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'purchases',
      key: 'id'
    }
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
  unitCost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  }
}, {
  tableName: 'purchase_items',
  timestamps: true
});

module.exports = PurchaseItem;
