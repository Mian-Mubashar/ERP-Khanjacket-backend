const app = require('./app');
const config = require('./config/env');
const { sequelize, testConnection } = require('./config/database');
const { runUp } = require('./migrations/runner');
const seedDatabase = require('./seeders/initialSeeder');
const logger = require('./utils/logger');

let server;

const startServer = async () => {
  try {
    logger.info('Starting Khan Clothes Warehouse Backend Server...');

    // 1. Verify Database Connection
    await testConnection();

    // 2. Execute Pending Migrations (Ensures DB schema is 100% current)
    await runUp();

    // 3. Seed Initial Master Data if empty
    await seedDatabase();

    // 4. Start HTTP Server
    server = app.listen(config.port, () => {
      console.log('================================================================');
      console.log(`🚀 KHAN CLOTHES WAREHOUSE BACKEND RUNNING SUCCESSFULLY`);
      console.log(`📡 Port:        ${config.port}`);
      console.log(`🌐 Mode:        ${config.env.toUpperCase()}`);
      console.log(`💾 SQL Engine:  ${config.db.dialect.toUpperCase()}`);
      console.log(`🔗 API Base:    http://localhost:${config.port}${config.apiPrefix}`);
      console.log(`🩺 Health:      http://localhost:${config.port}${config.apiPrefix}/health`);
      console.log('================================================================');
    });

  } catch (error) {
    logger.error('FATAL: Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown Handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await sequelize.close();
        logger.info('Database connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing database connection:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise);
  logger.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();
