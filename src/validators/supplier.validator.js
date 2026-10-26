const Joi = require('joi');

const createSupplierSchema = {
  body: Joi.object({
    name: Joi.string().trim().required().messages({
      'any.required': 'Supplier contact person name is required'
    }),
    company: Joi.string().trim().required().messages({
      'any.required': 'Company / factory name is required'
    }),
    phone: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    openingBalance: Joi.number().min(0).empty('').default(0),
    currency: Joi.string().default('PKR'),
    notes: Joi.string().allow('', null)
  })
};

const updateSupplierSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    name: Joi.string().trim(),
    company: Joi.string().trim(),
    phone: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    currency: Joi.string(),
    notes: Joi.string().allow('', null)
  }).min(1)
};

module.exports = {
  createSupplierSchema,
  updateSupplierSchema
};
