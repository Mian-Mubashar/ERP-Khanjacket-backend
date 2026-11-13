const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some(
      t => (typeof t === 'string' ? t.toLowerCase() : t.tableName.toLowerCase()) === 'device_push_tokens'
    );

    if (!tableExists) {
      await queryInterface.createTable('device_push_tokens', {
        id: {
          type: DataTypes.STRING(60),
          primaryKey: true,
          allowNull: false
        },
        token: {
          type: DataTypes.STRING(512),
          allowNull: false,
          unique: true
        },
        platform: {
          type: DataTypes.ENUM('android', 'ios', 'web'),
          allowNull: false,
          defaultValue: 'android'
        },
        userId: {
          type: DataTypes.STRING(50),
          allowNull: true
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
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      });

      await queryInterface.addIndex('device_push_tokens', ['token'], { unique: true });
      await queryInterface.addIndex('device_push_tokens', ['userId']);
      await queryInterface.addIndex('device_push_tokens', ['platform']);
      await queryInterface.addIndex('device_push_tokens', ['isActive']);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('device_push_tokens');
  }
};

