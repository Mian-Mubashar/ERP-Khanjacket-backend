'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('purchases', {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      invoiceNo: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      supplierId: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'suppliers',
          key: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      supplierName: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      purchaseDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      containerNo: {
        type: Sequelize.STRING(100),
        defaultValue: 'N/A',
        allowNull: false
      },
      itemsSubtotal: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      extraExpenses: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      expenseNote: {
        type: Sequelize.STRING(255),
        defaultValue: 'Freight & Clearing',
        allowNull: true
      },
      totalBill: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      paidAmount: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      remainingAmount: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'Received in Warehouse',
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

    await queryInterface.addIndex('purchases', ['invoiceNo']);
    await queryInterface.addIndex('purchases', ['supplierId']);
    await queryInterface.addIndex('purchases', ['purchaseDate']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('purchases');
  }
};
