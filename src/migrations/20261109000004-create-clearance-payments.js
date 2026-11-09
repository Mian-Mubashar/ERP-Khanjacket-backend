'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('clearance_payments')) {
      await queryInterface.createTable('clearance_payments', {
        id: {
          type: Sequelize.STRING(50),
          primaryKey: true,
          allowNull: false
        },
        clearanceId: {
          type: Sequelize.STRING(50),
          allowNull: false,
          references: {
            model: 'container_clearances',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        clearingAgent: {
          type: Sequelize.STRING(150),
          allowNull: false,
          defaultValue: 'BARCA TRADERS'
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
          defaultValue: 'Bank Transfer / Wire'
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
          allowNull: true,
          defaultValue: 'Admin Khan'
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

      await queryInterface.addIndex('clearance_payments', ['clearanceId']);
      await queryInterface.addIndex('clearance_payments', ['date']);
      await queryInterface.addIndex('clearance_payments', ['clearingAgent']);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('clearance_payments');
  }
};

