/**
 * File request validation schemas.
 * @module validators/file.validator
 */
const Joi = require('joi');

const sessionIdParam = Joi.object({
  sessionId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid session ID',
  }),
});

const fileIdParam = Joi.object({
  sessionId: Joi.string().hex().length(24).required(),
  fileId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid file ID',
  }),
});

const queryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  direction: Joi.string().valid('upload', 'download').optional(),
});

module.exports = {
  sessionIdParam,
  fileIdParam,
  queryParams,
};