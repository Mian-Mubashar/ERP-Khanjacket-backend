'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('supplier_payments', {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.STRING(100),
        defaultValue: 'Bank TT / Wire Transfer',
        allowNull: false
      },
      refNo: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      recordedBy: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex('supplier_payments', ['supplierId']);
    await queryInterface.addIndex('supplier_payments', ['date']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('supplier_payments');
  }
};
