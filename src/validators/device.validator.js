const Joi = require('joi');

const createDeviceSchema = {
  body: Joi.object({
    deviceName: Joi.string().trim().required().messages({
      'any.required': 'Device name is required'
    }),
    model: Joi.string().trim().allow('', null).default('Smart Mobile Device'),
    owner: Joi.string().trim().required().messages({
      'any.required': 'Staff member/owner name is required'
    }),
    location: Joi.string().trim().allow('', null).default('Karachi Central Warehouse')
  })
};

module.exports = {
  createDeviceSchema
};
