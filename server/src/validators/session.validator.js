const Joi = require('joi');
const { SESSION_STATUS } = require('../utils/constants');

const startBody = Joi.object({
  workspaceId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid workspace ID',
  }),
});

const sessionIdParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid session ID',
  }),
});

const queryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  status: Joi.string().optional(),   // accepts "running" or "running,paused"
  userId: Joi.string().hex().length(24).optional(),
});

const orgSessionQueryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  status: Joi.string().optional(),   // accepts "running" or "running,paused"
  userId: Joi.string().hex().length(24).optional(),
});

module.exports = {
  startBody,
  sessionIdParam,
  queryParams,
  orgSessionQueryParams,
};