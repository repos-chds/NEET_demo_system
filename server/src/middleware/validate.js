const Joi = require('joi');
const ApiResponse = require('../utils/apiResponse');

/**
 * Request validation middleware factory
 * @param {Joi.ObjectSchema} schema - Joi schema to validate against
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return ApiResponse.badRequest(res, 'Validation failed', errors);
    }

    req[property] = value;
    next();
  };
};

module.exports = validate;
