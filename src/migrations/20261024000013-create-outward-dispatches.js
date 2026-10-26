'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('outward_dispatches', {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      challanNo: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
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
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      customerId: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      destination: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      customerName: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      customerPhone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      unitSalePrice: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      totalSaleAmount: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: false
      },
      gatePassNo: {
        type: Sequelize.STRING(50),
        allowNull: true
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('outward_dispatches', ['challanNo']);
    await queryInterface.addIndex('outward_dispatches', ['articleNo']);
    await queryInterface.addIndex('outward_dispatches', ['customerId']);
    await queryInterface.addIndex('outward_dispatches', ['date']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('outward_dispatches');
  }
};
