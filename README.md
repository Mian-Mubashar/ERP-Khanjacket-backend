# Khan Clothes Warehouse Management System - Backend API

> **Senior-Grade, Production-Ready Node.js + Express + Sequelize SQL Backend with Migrations, Dynamic DB Integration & Granular Role-Based Access Control (RBAC)**

---

## 🏛️ Architecture Overview

The backend is built following clean, layered architectural patterns (Separation of Concerns):

```
warehouse-backend/
├── .env                     # Active environment configuration (never commit secrets)
├── .env.example             # Complete environment variables template with full docs
├── .sequelizerc             # Sequelize CLI path mappings
├── .gitignore
├── package.json             # Scripts: migrate, migrate:undo, migrate:status, migrate:fresh, seed, dev, start
├── README.md                # Full technical & API documentation
├── data/
│   └── warehouse.sqlite     # Instant zero-config local SQL database (when using SQLite)
└── src/
    ├── config/
    │   ├── database.js      # Multi-dialect Sequelize instance (SQLite, MySQL, PostgreSQL)
    │   ├── env.js           # Validated, immutable environment configuration
    │   └── sequelizeCliConfig.js # Dynamic CLI config loaded from env.js
    ├── constants/
    │   ├── roles.js         # Role constants (Admin, Staff, Viewer)
    │   └── permissions.js   # Granular permissions & role mapping
    ├── migrations/          # 17 Official Sequelize Migration Files
    │   ├── 20261024000001-create-roles.js
    │   ├── 20261024000002-create-permissions.js
    │   ├── 20261024000003-create-role-permissions.js
    │   ├── 20261024000004-create-users.js
    │   ├── 20261024000005-create-categories.js
    │   ├── 20261024000006-create-stuffs.js
    │   ├── 20261024000007-create-cities.js
    │   ├── 20261024000008-create-suppliers.js
    │   ├── 20261024000009-create-articles.js
    │   ├── 20261024000010-create-customers.js
    │   ├── 20261024000011-create-purchases.js
    │   ├── 20261024000012-create-purchase-items.js
    │   ├── 20261024000013-create-outward-dispatches.js
    │   ├── 20261024000014-create-supplier-payments.js
    │   ├── 20261024000015-create-customer-payments.js
    │   ├── 20261024000016-create-authorized-devices.js
    │   ├── 20261024000017-create-audit-logs.js
    │   └── runner.js        # Programmatic & CLI migration engine
    ├── models/              # Sequelize model definitions & associations
    ├── middlewares/         # Auth, RBAC permissions, validation, rate limiting, error handling
    ├── validators/          # Joi schemas for request validation & sanitization
    ├── services/            # Transactional business logic (Sequelize managed transactions)
    ├── controllers/         # HTTP request/response handlers
    ├── routes/              # Express API routers mounted under /api/v1
    ├── seeders/             # Automatic database population with initial master records
    ├── utils/               # Standardized responses, ApiError, logger
    ├── app.js               # Express application configuration
    └── server.js            # Server entry point, auto-migration on boot & graceful shutdown
```

---

## 🗄️ Database Migrations

You can run, check, or rollback migrations at any time using standard npm scripts:

| Command | Action |
| :--- | :--- |
| `npm run migrate` | Executes all pending migrations in strict dependency order |
| `npm run migrate:status` | Shows which migrations are applied and which are pending |
| `npm run migrate:undo` | Reverts the last executed migration |
| `npm run migrate:reset` | Reverts all migrations in reverse order |
| `npm run migrate:fresh` | Drops all tables, re-runs all migrations, and re-seeds master data |
| `npm run db:setup` | Runs migrations followed by initial data seeding |
| `npm run seed` | Seeds default master records (Admin user, categories, fabrics, articles, etc.) |

---

## 🔐 Role-Based Access Control (RBAC) & Permissions

The system implements a granular permission system:

| Permission Key | Description | Admin | Staff | Viewer |
| :--- | :--- | :---: | :---: | :---: |
| `articles:read` | View article catalog & live stock | ✅ | ✅ | ✅ |
| `articles:create` | Add new articles | ✅ | ✅ | ❌ |
| `articles:update` | Update article cost / alert thresholds | ✅ | ✅ | ❌ |
| `articles:delete` | Remove articles (only with 0 stock) | ✅ | ❌ | ❌ |
| `purchases:read` | View China import invoices | ✅ | ✅ | ✅ |
| `purchases:create` | Record China container purchases & auto-increment stock | ✅ | ✅ | ❌ |
| `outward:read` | View outward dispatch challans | ✅ | ✅ | ✅ |
| `outward:create` | Dispatch goods, deduct stock & update customer khata | ✅ | ✅ | ❌ |
| `suppliers:read` | View vendor accounts | ✅ | ✅ | ✅ |
| `suppliers:create` | Register new vendors | ✅ | ❌ | ❌ |
| `payments:supplier:create` | Issue bank TT / wire transfers | ✅ | ❌ | ❌ |
| `customers:read` | View wholesale shopkeeper khatas | ✅ | ✅ | ✅ |
| `customers:create` | Register wholesale shopkeepers | ✅ | ✅ | ❌ |
| `customers:update` | Update customer details | ✅ | ✅ | ❌ |
| `payments:customer:create` | Record customer cash receipts & clear balances | ✅ | ✅ | ❌ |
| `devices:read` | View authorized hardware devices | ✅ | ✅ | ❌ |
| `devices:create` | Authorize new mobile phone (Max 5 units) | ✅ | ❌ | ❌ |
| `devices:toggle` | Revoke or restore mobile phone access | ✅ | ❌ | ❌ |
| `audit:read` | View system audit trail | ✅ | ✅ | ✅ |
| `backup:export` | Export full cloud JSON backup | ✅ | ❌ | ✅ |

---

## ⚙️ Environment Variables (`.env`)

All configurations are strictly externalized via `.env`. **Zero hardcoded values**:

```env
# Server
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Database Engine Switcher
# Options: sqlite | mysql | postgres
DB_DIALECT=sqlite
DB_STORAGE=./data/warehouse.sqlite

# MySQL / PostgreSQL Config (When DB_DIALECT=mysql or postgres)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=khan_warehouse_db
DB_USER=root
DB_PASSWORD=your_password
DB_POOL_MAX=10
DB_POOL_MIN=0
DB_LOGGING=false

# Security & JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

# Hardware Limit Policy
MAX_AUTHORIZED_DEVICES=5
```

---

## 🚀 Running the Project

```bash
cd warehouse-backend

# 1. Run Migrations & Seed DB
npm run db:setup

# 2. Start in Development Mode (Live Watch)
npm run dev
```

Default Accounts:
- **Admin**: `admin@khanclothes.com` / `admin123`
- **Staff**: `staff@khanclothes.com` / `staff123`
- **Viewer**: `viewer@khanclothes.com` / `viewer123`
