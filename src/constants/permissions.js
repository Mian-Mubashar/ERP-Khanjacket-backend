const PERMISSIONS = {
  // Articles
  ARTICLES_READ: 'articles:read',
  ARTICLES_CREATE: 'articles:create',
  ARTICLES_UPDATE: 'articles:update',
  ARTICLES_DELETE: 'articles:delete',

  // Categories & Stuffs
  CATEGORIES_MANAGE: 'categories:manage',
  STUFFS_MANAGE: 'stuffs:manage',

  // Cities / Branches
  CITIES_MANAGE: 'cities:manage',

  // Purchases (China Inward)
  PURCHASES_READ: 'purchases:read',
  PURCHASES_CREATE: 'purchases:create',
  PURCHASES_UPDATE: 'purchases:update',
  PURCHASES_DELETE: 'purchases:delete',

  // Outward Dispatches
  OUTWARD_READ: 'outward:read',
  OUTWARD_CREATE: 'outward:create',
  OUTWARD_UPDATE: 'outward:update',
  OUTWARD_DELETE: 'outward:delete',

  // Suppliers & Vendor Ledger
  SUPPLIERS_READ: 'suppliers:read',
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_UPDATE: 'suppliers:update',
  SUPPLIERS_DELETE: 'suppliers:delete',
  SUPPLIER_PAYMENTS_READ: 'payments:supplier:read',
  SUPPLIER_PAYMENTS_CREATE: 'payments:supplier:create',

  // Wholesale Customers & Khata
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMER_PAYMENTS_READ: 'payments:customer:read',
  CUSTOMER_PAYMENTS_CREATE: 'payments:customer:create',

  // Hardware Devices (4-5 Devices Policy)
  DEVICES_READ: 'devices:read',
  DEVICES_CREATE: 'devices:create',
  DEVICES_TOGGLE: 'devices:toggle',
  DEVICES_DELETE: 'devices:delete',

  // Audit Logs & Security
  AUDIT_READ: 'audit:read',
  BACKUP_EXPORT: 'backup:export',
  BACKUP_RESTORE: 'backup:restore',

  // User Management
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage'
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Default role permissions mapping
const DEFAULT_ROLE_PERMISSIONS = {
  Admin: ALL_PERMISSIONS,
  Staff: [
    PERMISSIONS.ARTICLES_READ,
    PERMISSIONS.ARTICLES_CREATE,
    PERMISSIONS.ARTICLES_UPDATE,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.STUFFS_MANAGE,
    PERMISSIONS.CITIES_MANAGE,
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.OUTWARD_READ,
    PERMISSIONS.OUTWARD_CREATE,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.SUPPLIER_PAYMENTS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMER_PAYMENTS_READ,
    PERMISSIONS.CUSTOMER_PAYMENTS_CREATE,
    PERMISSIONS.DEVICES_READ,
    PERMISSIONS.AUDIT_READ
  ],
  Viewer: [
    PERMISSIONS.ARTICLES_READ,
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.OUTWARD_READ,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.SUPPLIER_PAYMENTS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMER_PAYMENTS_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.BACKUP_EXPORT
  ]
};

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS
};
