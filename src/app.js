const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/apiError');

const app = express();

// 1. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// 2. HTTP Request Compression
app.use(compression());

// 3. Cross-Origin Resource Sharing (CORS)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (config.cors.origin.includes('*') || config.cors.origin.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 4. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. HTTP Logging
if (config.env !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// 6. Global API Rate Limiter
app.use(config.apiPrefix, apiLimiter);

// 7. Mount Main API Routes
app.use(config.apiPrefix, routes);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    app: 'Khan Clothes Central Warehouse API',
    version: '1.0.0',
    documentation: `${config.apiPrefix}/health`,
    status: 'Running'
  });
});

// 8. Handle 404 for unknown endpoints
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found on this server`));
});

// 9. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
