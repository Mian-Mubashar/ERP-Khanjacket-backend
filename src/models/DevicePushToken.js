const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DevicePushToken = sequelize.define('DevicePushToken', {
  id: {
    type: DataTypes.STRING(60),
    primaryKey: true,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING(512),
    allowNull: false,
    unique: true,
    comment: 'FCM / APNs Device Registration Token'
  },
  platform: {
    type: DataTypes.ENUM('android', 'ios', 'web'),
    allowNull: false,
    defaultValue: 'android'
  },
  userId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Associated user ID if authenticated'
  },
  deviceId: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  deviceName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  appVersion: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'device_push_tokens',
  timestamps: true,
  indexes: [
    { fields: ['token'], unique: true },
    { fields: ['userId'] },
    { fields: ['platform'] },
    { fields: ['isActive'] }
  ]
});

module.exports = DevicePushToken;

