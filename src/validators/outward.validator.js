const Joi = require('joi');

const createOutwardSchema = {
  body: Joi.object({
    articleNo: Joi.string().trim().uppercase().required().messages({
      'any.required': 'Article selection is required'
    }),
    quantity: Joi.number().integer().positive().required().messages({
      'any.required': 'Dispatched quantity is required'
    }),
    destination: Joi.string().trim().required().messages({
      'any.required': 'Destination address/market is required'
    }),
    customerName: Joi.string().trim().required().messages({
      'any.required': 'Customer or shopkeeper name is required'
    }),
    customerId: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    customerPhone: Joi.string().allow('', null),
    unitSalePrice: Joi.number().min(0).empty('').default(0),
    challanNo: Joi.string().allow('', null),
    gatePassNo: Joi.string().allow('', null),
    date: Joi.date().iso().allow('', null),
    notes: Joi.string().allow('', null)
  })
};

module.exports = {
  createOutwardSchema
};
