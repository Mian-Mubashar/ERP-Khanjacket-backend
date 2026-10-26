const { sequelize } = require('../config/database');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const User = require('./User');
const Article = require('./Article');
const Category = require('./Category');
const Stuff = require('./Stuff');
const City = require('./City');
const Supplier = require('./Supplier');
const Customer = require('./Customer');
const Purchase = require('./Purchase');
const PurchaseItem = require('./PurchaseItem');
const Outward = require('./Outward');
const SupplierPayment = require('./SupplierPayment');
const CustomerPayment = require('./CustomerPayment');
const Device = require('./Device');
const AuditLog = require('./AuditLog');
const WarehouseLocation = require('./WarehouseLocation');

// Define Relationships

// Role <-> User (1:N)
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Role <-> Permission (M:N)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

// Supplier <-> Purchase (1:N)
Supplier.hasMany(Purchase, { foreignKey: 'supplierId', as: 'purchases' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Purchase <-> PurchaseItem (1:N)
Purchase.hasMany(PurchaseItem, { foreignKey: 'purchaseId', as: 'items', onDelete: 'CASCADE' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId', as: 'purchase' });

// Article <-> PurchaseItem (1:N)
Article.hasMany(PurchaseItem, { foreignKey: 'articleNo', as: 'purchaseItems' });
PurchaseItem.belongsTo(Article, { foreignKey: 'articleNo', as: 'article' });

// Article <-> Outward (1:N)
Article.hasMany(Outward, { foreignKey: 'articleNo', as: 'outwardDispatches' });
Outward.belongsTo(Article, { foreignKey: 'articleNo', as: 'article' });

// Supplier <-> SupplierPayment (1:N)
Supplier.hasMany(SupplierPayment, { foreignKey: 'supplierId', as: 'payments' });
SupplierPayment.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Customer <-> CustomerPayment (1:N)
Customer.hasMany(CustomerPayment, { foreignKey: 'customerId', as: 'payments' });
CustomerPayment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Customer <-> Outward (1:N optional)
Customer.hasMany(Outward, { foreignKey: 'customerId', as: 'dispatches' });
Outward.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = {
  sequelize,
  Role,
  Permission,
  RolePermission,
  User,
  Article,
  Category,
  Stuff,
  City,
  Supplier,
  Customer,
  Purchase,
  PurchaseItem,
  Outward,
  SupplierPayment,
  CustomerPayment,
  Device,
  AuditLog,
  WarehouseLocation
};
