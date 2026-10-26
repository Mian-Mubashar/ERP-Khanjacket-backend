'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    const exists = tables.some(
      t => (typeof t === 'string' ? t.toLowerCase() : t.tableName?.toLowerCase()) === 'warehouse_locations'
    );
    if (!exists) {
      await queryInterface.createTable('warehouse_locations', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        type: {
          type: Sequelize.STRING(50),
          defaultValue: 'Rack',
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
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('warehouse_locations');
  }
};
