'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('outward_dispatches');
    if (!tableInfo.isWithoutStock) {
      await queryInterface.addColumn('outward_dispatches', 'isWithoutStock', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('outward_dispatches');
    if (tableInfo.isWithoutStock) {
      await queryInterface.removeColumn('outward_dispatches', 'isWithoutStock');
    }
  }
};

