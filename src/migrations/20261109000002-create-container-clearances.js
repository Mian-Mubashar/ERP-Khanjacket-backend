const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some(
      t => (typeof t === 'string' ? t.toLowerCase() : t.tableName.toLowerCase()) === 'container_clearances'
    );

    if (!tableExists) {
      await queryInterface.createTable('container_clearances', {
        id: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          allowNull: false
        },
        invoiceNo: {
          type: DataTypes.STRING(100),
          allowNull: false,
          defaultValue: '1110'
        },
        clearingAgent: {
          type: DataTypes.STRING(150),
          allowNull: false,
          defaultValue: 'BARCA TRADERS'
        },
        consignee: {
          type: DataTypes.STRING(150),
          allowNull: true,
          defaultValue: 'GUL TRADER'
        },
        party: {
          type: DataTypes.STRING(150),
          allowNull: true,
          defaultValue: 'TOOR HAJI'
        },
        agency: {
          type: DataTypes.STRING(150),
          allowNull: true,
          defaultValue: 'ABASEEN'
        },
        port: {
          type: DataTypes.STRING(100),
          allowNull: true,
          defaultValue: 'AKDP'
        },
        weight: {
          type: DataTypes.STRING(50),
          allowNull: true,
          defaultValue: '22 MT'
        },
        containerSize: {
          type: DataTypes.STRING(50),
          allowNull: true,
          defaultValue: '40 FT'
        },
        gdNo: {
          type: DataTypes.STRING(100),
          allowNull: true,
          defaultValue: '1610'
        },
        blNumber: {
          type: DataTypes.STRING(100),
          allowNull: true,
          defaultValue: '026F533603'
        },
        containerNumber: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        openDate: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
        goDate: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
        billDate: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        purchaseId: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: 'purchases',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },

        // Itemized Charges
        customDuty: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        dryPortExpenses: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        serviceCharges: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        agencyFee: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        insCharges: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        roadTransport: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        driver: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        consigneeCharges: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        craneLabour: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        railway: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        otherExpenses: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },

        // Totals
        totalDutyAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        totalExpenses: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        grandTotal: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        paidAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        remainingAmount: {
          type: DataTypes.DECIMAL(14, 2),
          defaultValue: 0
        },
        paymentStatus: {
          type: DataTypes.STRING(50),
          defaultValue: 'Unpaid'
        },
        contactPhone: {
          type: DataTypes.STRING(100),
          defaultValue: '03349191961'
        },
        notes: {
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

      await queryInterface.addIndex('container_clearances', ['containerNumber']);
      await queryInterface.addIndex('container_clearances', ['invoiceNo']);
      await queryInterface.addIndex('container_clearances', ['billDate']);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('container_clearances');
  }
};

