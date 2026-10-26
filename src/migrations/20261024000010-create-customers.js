'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      shopName: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      shopkeeperName: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      marketAddress: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      totalPiecesReceived: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      totalBill: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      totalPaid: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      remainingBalance: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('customers', ['shopName']);
    await queryInterface.addIndex('customers', ['city']);
    await queryInterface.addIndex('customers', ['phone']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('customers');
  }
};
