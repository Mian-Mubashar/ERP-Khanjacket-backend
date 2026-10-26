const {
  sequelize,
  Role,
  Permission,
  RolePermission,
  User,
  Category,
  Stuff,
  City,
  Supplier,
  Article,
  Customer,
  Purchase,
  PurchaseItem,
  Outward,
  SupplierPayment,
  CustomerPayment,
  Device,
  AuditLog
} = require('../models');
const { ROLES } = require('../constants/roles');
const { PERMISSIONS, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } = require('../constants/permissions');
const config = require('../config/env');
const logger = require('../utils/logger');

const seedDatabase = async () => {
  logger.info('[Seeder] Starting automatic database population...');

  try {
    // 1. Seed Roles
    const roleMap = {};
    for (const roleName of Object.values(ROLES)) {
      const [role] = await Role.findOrCreate({
        where: { name: roleName },
        defaults: {
          name: roleName,
          description: `${roleName} privileges for Khan Clothes system`
        }
      });
      roleMap[roleName] = role;
    }

    // 2. Seed Permissions
    const permMap = {};
    for (const permKey of ALL_PERMISSIONS) {
      const [categoryName] = permKey.split(':');
      const [permission] = await Permission.findOrCreate({
        where: { name: permKey },
        defaults: {
          name: permKey,
          description: `Permission to perform ${permKey}`,
          category: categoryName
        }
      });
      permMap[permKey] = permission;
    }

    // 3. Associate Roles with Permissions
    for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = roleMap[roleName];
      if (role) {
        for (const permName of permissions) {
          const perm = permMap[permName];
          if (perm) {
            await RolePermission.findOrCreate({
              where: {
                roleId: role.id,
                permissionId: perm.id
              }
            });
          }
        }
      }
    }

    // 4. Seed Default Users
    const defaultUsers = [
      {
        name: config.defaultAdmin.name,
        email: config.defaultAdmin.email,
        password: config.defaultAdmin.password,
        roleId: roleMap[ROLES.ADMIN].id
      },
      {
        name: 'Tariq Mehmood (Staff)',
        email: 'staff@khanclothes.com',
        password: 'staff123',
        roleId: roleMap[ROLES.STAFF].id
      },
      {
        name: 'Asim Bilal (Auditor)',
        email: 'viewer@khanclothes.com',
        password: 'viewer123',
        roleId: roleMap[ROLES.VIEWER].id
      }
    ];

    for (const u of defaultUsers) {
      const existing = await User.findOne({ where: { email: u.email } });
      if (!existing) {
        await User.create(u);
      }
    }

    // 5. Dynamic Categories: Purely managed by client via ERP interface

    // 6. Seed Stuffs
    const stuffs = [
      'Parachute (Waterproof)',
      'Thermal Fleece (Warm)',
      'Leather / Rexine',
      'Down Puffer (Feather Padding)',
      'Windbreaker (Nylon)',
      'Denim / Cotton Twill',
      'Cotton Microfiber',
      'Softshell 4-Way Stretch'
    ];
    for (const name of stuffs) {
      await Stuff.findOrCreate({ where: { name }, defaults: { name } });
    }

    // 7. Seed Cities / Destination Branches
    const cities = [
      { id: 1, name: 'Lahore', totalShops: 0, totalMalSent: 0 },
      { id: 2, name: 'Islamabad', totalShops: 0, totalMalSent: 0 },
      { id: 3, name: 'Karachi', totalShops: 0, totalMalSent: 0 },
      { id: 4, name: 'Faisalabad', totalShops: 0, totalMalSent: 0 },
      { id: 5, name: 'Rawalpindi', totalShops: 0, totalMalSent: 0 },
      { id: 6, name: 'Peshawar', totalShops: 0, totalMalSent: 0 },
      { id: 7, name: 'Multan', totalShops: 0, totalMalSent: 0 }
    ];
    for (const city of cities) {
      await City.findOrCreate({ where: { id: city.id }, defaults: city });
    }

    // 8. Seed Authorized Hardware Devices (Khan Clothes 4-5 mobile units policy)
    const devices = [
      {
        id: 'DEV-1',
        deviceName: "Owner's iPhone 15 Pro",
        model: 'Apple iPhone 15 Pro Max',
        owner: 'Khan Sb (Owner)',
        location: 'Karachi, Pakistan',
        ipAddress: '182.180.124.90',
        lastActive: 'Active Just Now',
        status: 'Authorized',
        isCurrent: true,
        addedOn: '2026-01-15'
      },
      {
        id: 'DEV-2',
        deviceName: 'Warehouse Manager Samsung S24',
        model: 'Samsung Galaxy S24 Ultra',
        owner: 'Tariq Mehmood (Warehouse Incharge)',
        location: 'Karachi Central Warehouse',
        ipAddress: '39.40.112.54',
        lastActive: '12 minutes ago',
        status: 'Authorized',
        isCurrent: false,
        addedOn: '2026-02-10'
      },
      {
        id: 'DEV-3',
        deviceName: 'Accounts Office iPad Pro',
        model: 'iPad Pro 12.9" M2',
        owner: 'Asim Bilal (Chief Accountant)',
        location: 'Head Office, Lahore',
        ipAddress: '111.119.187.23',
        lastActive: '1 hour ago',
        status: 'Authorized',
        isCurrent: false,
        addedOn: '2026-03-01'
      },
      {
        id: 'DEV-4',
        deviceName: 'Warehouse Scanner Tablet',
        model: 'Lenovo Tab P11 Plus (Barcode/Gate Scanner)',
        owner: 'Farhan (Gate Operator)',
        location: 'Karachi Warehouse Gate 2',
        ipAddress: '182.180.124.95',
        lastActive: '3 hours ago',
        status: 'Authorized',
        isCurrent: false,
        addedOn: '2026-05-18'
      }
    ];
    for (const dev of devices) {
      await Device.findOrCreate({ where: { id: dev.id }, defaults: dev });
    }

    logger.info('[Seeder] Essential master tables (Roles, Permissions, Users, Categories, Stuffs, Cities, Devices) verified!');
  } catch (error) {
    logger.error('[Seeder] Seeding error:', error.message);
    throw error;
  }
};

// If run directly via command line
if (require.main === module) {
  const { testConnection } = require('../config/database');
  (async () => {
    try {
      await testConnection();
      await sequelize.sync();
      await seedDatabase();
      console.log('Seeder completed successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Seeder execution failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = seedDatabase;
