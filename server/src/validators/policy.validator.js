/**
 * Policy template request validation schemas.
 * @module validators/policy.validator
 */
const Joi = require('joi');
const { POLICY_OPTIONS } = require('../utils/constants');

const policyOptionsSchema = Joi.object({
  filePersistence: Joi.boolean().optional(),
  clipboard: Joi.boolean().optional(),
  audio: Joi.boolean().optional(),
  webcam: Joi.boolean().optional(),
  microphone: Joi.boolean().optional(),
  downloadEnabled: Joi.boolean().optional(),
  uploadEnabled: Joi.boolean().optional(),
  maxSessionDuration: Joi.number().integer().min(0).optional(),
  blockedIps: Joi.array().items(Joi.string().ip({ cidr: 'optional' })).optional(),
});

const createBody = Joi.object({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().max(300).allow('').default(''),
  options: policyOptionsSchema.required(),
  isDefault: Joi.boolean().default(false),
});

const updateBody = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  description: Joi.string().max(300).optional(),
  options: policyOptionsSchema.optional(),
  isDefault: Joi.boolean().optional(),
}).min(1);

const templateIdParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid policy template ID',
  }),
});

const queryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = {
  createBody,
  updateBody,
  templateIdParam,
  queryParams,
};