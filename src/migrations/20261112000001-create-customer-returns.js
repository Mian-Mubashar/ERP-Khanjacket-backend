'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_returns', {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      returnSlipNo: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      customerId: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      customerName: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
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
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      unitPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      totalAmount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0
      },
      reason: {
        type: Sequelize.STRING(150),
        allowNull: true,
        defaultValue: 'General Maal Wapsi'
      },
      restoreStock: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      recordedBy: {
        type: Sequelize.STRING(100),
        allowNull: true
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('customer_returns', ['customerId']);
    await queryInterface.addIndex('customer_returns', ['articleNo']);
    await queryInterface.addIndex('customer_returns', ['date']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('customer_returns');
  }
};

