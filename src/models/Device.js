const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  deviceName: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  model: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  owner: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(200),
    defaultValue: 'Karachi Central Warehouse'
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  lastActive: {
    type: DataTypes.STRING(100),
    defaultValue: 'Just Now'
  },
  status: {
    type: DataTypes.ENUM('Authorized', 'Revoked'),
    defaultValue: 'Authorized'
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  addedOn: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'authorized_devices',
  timestamps: true
});

module.exports = Device;
