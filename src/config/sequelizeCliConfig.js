const config = require('./env');

const dbConfig = {
  dialect: config.db.dialect,
  logging: config.db.logging
};

if (config.db.dialect === 'sqlite') {
  dbConfig.storage = config.db.storage;
} else {
  dbConfig.host = config.db.host;
  dbConfig.port = config.db.port;
  dbConfig.database = config.db.name;
  dbConfig.username = config.db.user;
  dbConfig.password = config.db.password;
  dbConfig.pool = config.db.pool;
}

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig
};
