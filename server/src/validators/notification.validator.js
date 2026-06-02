const Joi = require('joi');
const {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SCOPE,
} = require('../utils/constants');

const createBody = Joi.object({
  scope: Joi.string()
    .valid(...Object.values(NOTIFICATION_SCOPE), 'admins')
    .required(),
  recipientIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .when('scope', {
      is: Joi.valid('user', 'admins'),
      then: Joi.array().min(1).required(),          // ← fixed
      otherwise: Joi.array().optional(),
    }),
  category: Joi.string()
    .valid(...Object.values(NOTIFICATION_CATEGORIES))
    .default(NOTIFICATION_CATEGORIES.INFO),
  title: Joi.string().max(200).required(),
  body: Joi.string().max(1000).allow('').default(''),
  organizationId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null),
});

const notificationIdParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid notification ID',
  }),
});

const queryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  category: Joi.string()
    .valid(...Object.values(NOTIFICATION_CATEGORIES))
    .optional(),
  unreadOnly: Joi.boolean().optional(),
});

module.exports = {
  createBody,
  notificationIdParam,
  queryParams,
};