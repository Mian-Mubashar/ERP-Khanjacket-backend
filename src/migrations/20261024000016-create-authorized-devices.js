'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('authorized_devices', {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      deviceName: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      model: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      owner: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      location: {
        type: Sequelize.STRING(200),
        defaultValue: 'Karachi Central Warehouse',
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      lastActive: {
        type: Sequelize.STRING(100),
        defaultValue: 'Just Now',
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Authorized', 'Revoked'),
        defaultValue: 'Authorized',
        allowNull: false
      },
      isCurrent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      addedOn: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('authorized_devices', ['status']);
    await queryInterface.addIndex('authorized_devices', ['owner']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('authorized_devices');
  }
};
