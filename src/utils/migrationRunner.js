const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const { sequelize, testConnection } = require('../config/database');
const logger = require('./logger');

const META_TABLE = 'SequelizeMeta';

const getMigrationsDir = () => path.resolve(__dirname, '../migrations');

const ensureMetaTable = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  const metaExists = tables.some(
    t => (typeof t === 'string' ? t.toLowerCase() : t.tableName.toLowerCase()) === META_TABLE.toLowerCase()
  );

  if (!metaExists) {
    await queryInterface.createTable(META_TABLE, {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
      }
    });
    logger.info(`[Migrations] Created "${META_TABLE}" tracking table.`);
  }
};

/**
 * Get all executed migration names from SequelizeMeta
 */
const getExecutedMigrations = async (queryInterface) => {
  await ensureMetaTable(queryInterface);
  const rows = await queryInterface.select(null, META_TABLE, { raw: true });
  return rows.map(r => r.name);
};

/**
 * Get all migration files from the migrations folder
 */
const getMigrationFiles = () => {
  const migrationsDir = getMigrationsDir();
  return fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js') && !file.includes('runner'))
    .sort();
};

/**
 * Run all pending migrations (UP)
 */
const runUp = async () => {
  await testConnection();
  const queryInterface = sequelize.getQueryInterface();
  const executed = await getExecutedMigrations(queryInterface);
  const allFiles = getMigrationFiles();
  const pending = allFiles.filter(f => !executed.includes(f));

  if (pending.length === 0) {
    console.log('✅ [Migrations] Database schema is up to date! No pending migrations.');
    return;
  }

  console.log(`[Migrations] Found ${pending.length} pending migration(s)...`);

  const migrationsDir = getMigrationsDir();
  for (const file of pending) {
    console.log(`⏳ Migrating: ${file}...`);
    const migration = require(path.join(migrationsDir, file));
    const startTime = Date.now();

    await migration.up(queryInterface, sequelize.Sequelize);

    // Record migration in SequelizeMeta
    await queryInterface.insert(null, META_TABLE, { name: file });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✔ Migrated:  ${file} (${duration}s)`);
  }

  console.log('🎉 [Migrations] All migrations executed successfully!');
};

/**
 * Rollback the last migration (DOWN)
 */
const runDown = async () => {
  await testConnection();
  const queryInterface = sequelize.getQueryInterface();
  const executed = await getExecutedMigrations(queryInterface);

  if (executed.length === 0) {
    console.log('⚠️ [Migrations] No migrations found to revert.');
    return;
  }

  const lastFile = executed[executed.length - 1];
  console.log(`⏳ Reverting: ${lastFile}...`);
  const migrationsDir = getMigrationsDir();
  const migration = require(path.join(migrationsDir, lastFile));
  const startTime = Date.now();

  await migration.down(queryInterface, sequelize.Sequelize);

  // Remove migration from SequelizeMeta
  await queryInterface.delete(null, META_TABLE, { name: lastFile });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✔ Reverted:  ${lastFile} (${duration}s)`);
};

/**
 * Reset all migrations in reverse order (RESET)
 */
const runReset = async () => {
  await testConnection();
  const queryInterface = sequelize.getQueryInterface();
  const executed = await getExecutedMigrations(queryInterface);

  if (executed.length === 0) {
    console.log('⚠️ [Migrations] Database is already empty. No migrations to revert.');
    return;
  }

  console.log(`⏳ Reverting all ${executed.length} migration(s)...`);
  const reversed = [...executed].reverse();
  const migrationsDir = getMigrationsDir();

  for (const file of reversed) {
    console.log(`⏳ Reverting: ${file}...`);
    const migration = require(path.join(migrationsDir, file));
    await migration.down(queryInterface, sequelize.Sequelize);
    await queryInterface.delete(null, META_TABLE, { name: file });
    console.log(`✔ Reverted:  ${file}`);
  }

  console.log('🧹 [Migrations] All tables and migrations reverted successfully.');
};

/**
 * Show Migration Status
 */
const runStatus = async () => {
  await testConnection();
  const queryInterface = sequelize.getQueryInterface();
  const executed = await getExecutedMigrations(queryInterface);
  const allFiles = getMigrationFiles();

  console.log('\n================ DATABASE MIGRATIONS STATUS ================');
  allFiles.forEach(file => {
    const isApplied = executed.includes(file);
    const status = isApplied ? '✔ APPLIED' : '⏳ PENDING';
    console.log(` [${status}] ${file}`);
  });
  console.log('============================================================\n');
};

// Command line execution only when run directly
if (require.main === module) {
  const action = process.argv[2] || 'up';
  (async () => {
    try {
      switch (action.toLowerCase()) {
        case 'up':
        case 'migrate':
          await runUp();
          break;
        case 'down':
        case 'undo':
          await runDown();
          break;
        case 'reset':
          await runReset();
          break;
        case 'status':
          await runStatus();
          break;
        default:
          console.error(`Unknown action: "${action}". Valid options: up | down | reset | status`);
          process.exit(1);
      }
      await sequelize.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ [Migrations] Failed with error:', err);
      await sequelize.close().catch(() => {});
      process.exit(1);
    }
  })();
}

module.exports = {
  runUp,
  runDown,
  runReset,
  runStatus
};
