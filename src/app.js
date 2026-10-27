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
const allowedOrigins = [
  'https://khanjackethouse.com',
  'https://www.khanjackethouse.com',
  'http://khanjackethouse.com',
  'http://www.khanjackethouse.com',
  'https://api.khanjackethouse.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

if (Array.isArray(config.cors?.origin)) {
  config.cors.origin.forEach(o => {
    if (o && o !== '*' && !allowedOrigins.includes(o)) {
      allowedOrigins.push(o);
    }
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed =
      config.cors?.origin?.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.khanjackethouse.com') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));


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
