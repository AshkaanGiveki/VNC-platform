/**
 * User request validation schemas.
 * @module validators/user.validator
 */
const Joi = require('joi');
const { ROLES } = require('../utils/constants');

const createBody = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().trim().max(50).required(),
  lastName: Joi.string().trim().max(50).required(),
  role: Joi.string()
    .valid(...Object.values(ROLES).filter(r => r !== 'superadmin')) // exclude superadmin
    .default(ROLES.USER),
});

const updateBody = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().trim().max(50).optional(),
  lastName: Joi.string().trim().max(50).optional(),
  role: Joi.string()
    .valid(...Object.values(ROLES).filter(r => r !== 'superadmin'))
    .optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const userIdParam = Joi.object({
  userId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid user ID',
  }),
});

const queryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
  search: Joi.string().max(100).optional(),
});

module.exports = {
  createBody,
  updateBody,
  userIdParam,
  queryParams,
};