const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WarehouseLocation = sequelize.define('WarehouseLocation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.STRING(50),
    defaultValue: 'Rack'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'warehouse_locations',
  timestamps: true
});

module.exports = WarehouseLocation;
