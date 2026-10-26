const Joi = require('joi');

const createPurchaseSchema = {
  body: Joi.object({
    invoiceNo: Joi.string().trim().required().messages({
      'any.required': 'Purchase Invoice No is required'
    }),
    supplierId: Joi.string().trim().required().messages({
      'any.required': 'Supplier selection is required'
    }),
    supplierName: Joi.string().trim().required(),
    purchaseDate: Joi.date().iso().allow('', null),
    containerNo: Joi.string().allow('', null).default('N/A'),
    extraExpenses: Joi.number().min(0).empty('').default(0),
    expenseNote: Joi.string().allow('', null).default('Freight & Clearing'),
    paidAmount: Joi.number().min(0).empty('').default(0),
    paymentMethod: Joi.string().allow('', null).default('Bank TT / Wire Transfer'),
    notes: Joi.string().allow('', null).default(''),
    items: Joi.array().items(
      Joi.object({
        articleNo: Joi.string().trim().uppercase().required(),
        articleName: Joi.string().trim().required(),
        category: Joi.string().trim().required(),
        quantity: Joi.number().integer().positive().required(),
        unitCost: Joi.number().min(0).required()
      })
    ).min(1).required().messages({
      'array.min': 'At least one item line is required for purchase entry'
    })
  })
};

module.exports = {
  createPurchaseSchema
};
