const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Stuff = sequelize.define('Stuff', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'stuffs',
  timestamps: true
});

module.exports = Stuff;
