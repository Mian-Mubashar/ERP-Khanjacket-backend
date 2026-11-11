'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users');
    if (!tableInfo.avatar) {
      await queryInterface.addColumn('users', 'avatar', {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('users');
    if (tableInfo.avatar) {
      await queryInterface.removeColumn('users', 'avatar');
    }
  }
};

