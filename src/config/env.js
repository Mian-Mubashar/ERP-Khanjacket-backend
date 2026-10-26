const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  cors: {
    origin: (process.env.CORS_ORIGIN || '*')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  },

  db: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || path.resolve(__dirname, '../../data/warehouse.sqlite'),
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'khan_warehouse_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'khan_clothes_fallback_jwt_secret_dev_only',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 500,
    authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS, 10) || 20,
    maxAuthorizedDevices: parseInt(process.env.MAX_AUTHORIZED_DEVICES, 10) || 5
  },

  defaultAdmin: {
    name: process.env.DEFAULT_ADMIN_NAME || 'Admin Khan',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@khanclothes.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
  }
};

module.exports = Object.freeze(config);
