'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create 'areas' table if not exists
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map(t => (typeof t === 'string' ? t.toLowerCase() : t.tableName.toLowerCase()));
    
    if (!tableNames.includes('areas')) {
      await queryInterface.createTable('areas', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        cityName: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        cityId: {
          type: Sequelize.INTEGER,
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

    // 2. Add 'area' column to 'customers' table if not exists
    const customerColumns = await queryInterface.describeTable('customers');
    if (!customerColumns.area) {
      await queryInterface.addColumn('customers', 'area', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('customers', 'area');
    } catch (e) {
      // Ignore
    }
    try {
      await queryInterface.dropTable('areas');
    } catch (e) {
      // Ignore
    }
  }
};

