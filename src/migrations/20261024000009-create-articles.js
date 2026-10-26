'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('articles', {
      articleNo: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      stuff: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      totalPurchased: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      totalOut: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      currentStock: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      unitCost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      minAlertStock: {
        type: Sequelize.INTEGER,
        defaultValue: 100,
        allowNull: false
      },
      description: {
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

    await queryInterface.addIndex('articles', ['category']);
    await queryInterface.addIndex('articles', ['stuff']);
    await queryInterface.addIndex('articles', ['currentStock']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('articles');
  }
};
