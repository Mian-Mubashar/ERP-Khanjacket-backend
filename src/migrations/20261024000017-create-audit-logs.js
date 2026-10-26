'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      userName: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      userRole: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      action: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      impact: {
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

    await queryInterface.addIndex('audit_logs', ['category']);
    await queryInterface.addIndex('audit_logs', ['userRole']);
    await queryInterface.addIndex('audit_logs', ['createdAt']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('audit_logs');
  }
};
