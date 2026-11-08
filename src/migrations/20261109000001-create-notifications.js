const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // Check if table already exists
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some(
      t => (typeof t === 'string' ? t.toLowerCase() : t.tableName.toLowerCase()) === 'notifications'
    );

    if (!tableExists) {
      await queryInterface.createTable('notifications', {
        id: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          allowNull: false
        },
        type: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'SYSTEM'
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        category: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        referenceId: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        customerName: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        amount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0
        },
        urgency: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'normal'
        },
        isRead: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        metadata: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      });

      // Add indexes for lightning fast queries and 10-day purging
      await queryInterface.addIndex('notifications', ['createdAt']);
      await queryInterface.addIndex('notifications', ['type']);
      await queryInterface.addIndex('notifications', ['isRead']);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('notifications');
  }
};

