'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('purchase_items', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      purchaseId: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'purchases',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      articleNo: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'articles',
          key: 'articleNo'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      articleName: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      unitCost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      total: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false
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

    await queryInterface.addIndex('purchase_items', ['purchaseId']);
    await queryInterface.addIndex('purchase_items', ['articleNo']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('purchase_items');
  }
};
