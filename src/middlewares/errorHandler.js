const config = require('../config/env');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Centralized Express Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map(e => e.path).join(', ');
    error = ApiError.conflict(`Duplicate entry for unique field: ${fields}`);
  }

  // Handle Sequelize Database Validation Error
  else if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest('Database validation error', errors);
  }

  // Handle Sequelize Foreign Key Constraint Error
  else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = ApiError.badRequest('Referenced record does not exist or has dependent associations.');
  }

  // Handle Joi validation errors if thrown directly
  else if (err.isJoi) {
    const errors = err.details.map(d => ({ field: d.path.join('.'), message: d.message }));
    error = ApiError.badRequest('Validation error', errors);
  }

  // Handle JWT invalid signature or format
  else if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token');
  }

  // Handle Malformed JSON payload
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = ApiError.badRequest('Malformed JSON body in request');
  }

  // Convert generic non-ApiErrors to 500 ApiError
  else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], false, err.stack);
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(!config.isProduction && { stack: error.stack })
  };

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - Server Error: ${error.message}`, error.stack);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
