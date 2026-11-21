'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('customers');
      if (!tableInfo.openingBalance) {
        await queryInterface.addColumn('customers', 'openingBalance', {
          type: Sequelize.DECIMAL(14, 2),
          defaultValue: 0,
          allowNull: true
        });
      }
    } catch (err) {
      console.warn('[Migration Warning] customers.openingBalance check/add:', err.message);
    }
  },

  down: async (queryInterface) => {
    try {
      const tableInfo = await queryInterface.describeTable('customers');
      if (tableInfo.openingBalance) {
        await queryInterface.removeColumn('customers', 'openingBalance');
      }
    } catch (err) {
      console.warn('[Migration Warning] customers.openingBalance remove:', err.message);
    }
  }
};
