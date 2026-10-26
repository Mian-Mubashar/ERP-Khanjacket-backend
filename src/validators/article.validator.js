const Joi = require('joi');

const createArticleSchema = {
  body: Joi.object({
    articleNo: Joi.string().trim().uppercase().min(2).max(50).required().messages({
      'any.required': 'Article Number (e.g. BF411) is required'
    }),
    name: Joi.string().trim().min(2).max(200).required().messages({
      'any.required': 'Article name is required'
    }),
    category: Joi.string().trim().required().messages({
      'any.required': 'Category is required'
    }),
    stuff: Joi.string().trim().allow('', null).default('Parachute (Waterproof)'),
    initialStock: Joi.number().integer().min(0).empty('').default(0),
    unitCost: Joi.number().min(0).empty('').default(0),
    minAlertStock: Joi.number().integer().min(0).empty('').default(100),
    description: Joi.string().allow('', null).default(''),
    warehouseLocation: Joi.string().trim().allow('', null).default('Main Godown - Hall A')
  })
};

const updateArticleSchema = {
  params: Joi.object({
    articleNo: Joi.string().trim().required()
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(200),
    category: Joi.string().trim(),
    stuff: Joi.string().trim(),
    unitCost: Joi.number().min(0),
    minAlertStock: Joi.number().integer().min(0),
    description: Joi.string().allow('', null),
    warehouseLocation: Joi.string().trim().allow('', null)
  }).min(1)
};

module.exports = {
  createArticleSchema,
  updateArticleSchema
};
