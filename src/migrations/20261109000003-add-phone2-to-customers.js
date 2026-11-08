'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('customers');
    if (!tableInfo.phone2) {
      await queryInterface.addColumn('customers', 'phone2', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('customers');
    if (tableInfo.phone2) {
      await queryInterface.removeColumn('customers', 'phone2');
    }
  }
};

