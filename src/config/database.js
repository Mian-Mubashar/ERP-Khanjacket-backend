const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const config = require('./env');

let sequelize;

if (config.db.dialect === 'sqlite') {
  // Ensure SQLite data directory exists
  const storageDir = path.dirname(config.db.storage);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.db.storage,
    logging: config.db.logging,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false
    }
  });
} else {
  sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.db.logging,
    pool: config.db.pool,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false
    }
  });
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[Database] Connected successfully via dialect: "${config.db.dialect.toUpperCase()}"`);
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection
};
