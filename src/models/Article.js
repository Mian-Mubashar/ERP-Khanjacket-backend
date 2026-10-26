const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Article = sequelize.define('Article', {
  articleNo: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  stuff: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  totalPurchased: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalOut: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  currentStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unitCost: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  minAlertStock: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  warehouseLocation: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Main Godown - Hall A'
  }
}, {
  tableName: 'articles',
  timestamps: true
});

module.exports = Article;
