const Joi = require('joi');

const supplierPaymentSchema = {
  body: Joi.object({
    supplierId: Joi.string().trim().required().messages({
      'any.required': 'Supplier ID is required'
    }),
    amount: Joi.number().positive().required().messages({
      'any.required': 'Payment amount must be greater than 0'
    }),
    paymentMethod: Joi.string().allow('', null).default('Bank TT / Wire Transfer'),
    refNo: Joi.string().allow('', null),
    date: Joi.date().iso().allow('', null),
    notes: Joi.string().allow('', null)
  })
};

const customerPaymentSchema = {
  body: Joi.object({
    customerId: Joi.string().trim().required().messages({
      'any.required': 'Customer ID is required'
    }),
    amount: Joi.number().positive().required().messages({
      'any.required': 'Payment amount must be greater than 0'
    }),
    paymentMethod: Joi.string().allow('', null).default('Cash Receipt'),
    refNo: Joi.string().allow('', null),
    date: Joi.date().iso().allow('', null),
    notes: Joi.string().allow('', null)
  })
};

module.exports = {
  supplierPaymentSchema,
  customerPaymentSchema
};
