const ApiError = require('../utils/apiError');

/**
 * Request Validation Middleware using Joi
 * @param {Object} schema - Joi validation schema { body, query, params }
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validSchema = ['body', 'query', 'params'];
    const errors = [];

    validSchema.forEach((key) => {
      if (schema[key]) {
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          error.details.forEach((detail) => {
            errors.push({
              field: detail.path.join('.'),
              message: detail.message.replace(/['"]/g, '')
            });
          });
        } else {
          // Replace with sanitized/type-cast values
          req[key] = value;
        }
      }
    });

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed for submitted data', errors));
    }

    next();
  };
};

module.exports = validate;
