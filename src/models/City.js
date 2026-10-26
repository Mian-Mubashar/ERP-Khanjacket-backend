const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const City = sequelize.define('City', {
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
  totalShops: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalMalSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'cities',
  timestamps: true
});

module.exports = City;
