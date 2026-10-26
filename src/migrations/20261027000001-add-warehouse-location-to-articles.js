'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists before adding
    const tableInfo = await queryInterface.describeTable('articles');
    if (!tableInfo.warehouseLocation) {
      await queryInterface.addColumn('articles', 'warehouseLocation', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: 'Main Godown - Hall A'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('articles');
    if (tableInfo.warehouseLocation) {
      await queryInterface.removeColumn('articles', 'warehouseLocation');
    }
  }
};
