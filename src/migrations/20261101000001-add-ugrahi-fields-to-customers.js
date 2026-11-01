'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('customers');
    if (!tableInfo.inUgrahi) {
      await queryInterface.addColumn('customers', 'inUgrahi', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    if (!tableInfo.ugrahiRoute) {
      await queryInterface.addColumn('customers', 'ugrahiRoute', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('customers');
    if (tableInfo.inUgrahi) {
      await queryInterface.removeColumn('customers', 'inUgrahi');
    }
    if (tableInfo.ugrahiRoute) {
      await queryInterface.removeColumn('customers', 'ugrahiRoute');
    }
  }
};

