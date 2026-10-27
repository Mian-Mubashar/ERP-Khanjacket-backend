const config = require('./env');

const mysqlConfig = {
  dialect: 'mysql',
  host: config.db.host || process.env.DB_HOST || '127.0.0.1',
  port: parseInt(config.db.port || process.env.DB_PORT || 3306, 10),
  database: config.db.name || process.env.DB_NAME,
  username: config.db.user || process.env.DB_USER,
  password: config.db.password || process.env.DB_PASSWORD || '',
  logging: config.db.logging !== undefined ? config.db.logging : false,
  pool: config.db.pool
};

module.exports = {
  development: {
    ...mysqlConfig
  },
  test: {
    ...mysqlConfig
  },
  production: {
    ...mysqlConfig
  }
};
