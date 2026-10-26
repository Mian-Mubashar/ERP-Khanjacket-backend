'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('suppliers', {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      company: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      openingBalance: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      totalPurchases: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      totalPayments: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      remainingBalance: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'PKR',
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

    await queryInterface.addIndex('suppliers', ['company']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('suppliers');
  }
};
