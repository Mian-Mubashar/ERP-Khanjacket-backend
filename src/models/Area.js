const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Area = sequelize.define('Area', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  cityName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  cityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'areas',
  timestamps: true
});

module.exports = Area;

