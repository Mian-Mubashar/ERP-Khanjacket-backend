const Joi = require('joi');

const createCustomerSchema = {
  body: Joi.object({
    shopName: Joi.string().trim().required().messages({
      'any.required': 'Shop name is required'
    }),
    shopkeeperName: Joi.string().trim().allow('', null),
    city: Joi.string().trim().required().messages({
      'any.required': 'City branch is required'
    }),
    area: Joi.string().trim().allow('', null),
    marketAddress: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    openingBalance: Joi.number().min(0).empty('').default(0),
    notes: Joi.string().allow('', null),
    inUgrahi: Joi.boolean().allow(null).default(false),
    ugrahiRoute: Joi.string().trim().allow('', null)
  })
};

const updateCustomerSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    shopName: Joi.string().trim(),
    shopkeeperName: Joi.string().trim().allow('', null),
    city: Joi.string().trim(),
    area: Joi.string().trim().allow('', null),
    marketAddress: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    openingBalance: Joi.number().min(0).allow(null, '').default(0),
    notes: Joi.string().allow('', null),
    inUgrahi: Joi.boolean().allow(null),
    ugrahiRoute: Joi.string().trim().allow('', null)
  }).min(1)
};

module.exports = {
  createCustomerSchema,
  updateCustomerSchema
};
