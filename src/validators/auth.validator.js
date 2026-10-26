const Joi = require('joi');
const { ALL_ROLES } = require('../constants/roles');

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Valid email is required',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  })
};

const registerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid(...ALL_ROLES).default('Staff')
  })
};

const switchRoleSchema = {
  body: Joi.object({
    role: Joi.string().valid(...ALL_ROLES).required()
  })
};

module.exports = {
  loginSchema,
  registerSchema,
  switchRoleSchema
};
