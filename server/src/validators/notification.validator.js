/**
 * Notification request validation schemas.
 * @module validators/notification.validator
 */
const Joi = require('joi');
const {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SCOPE,
} = require('../utils/constants');

const createBody = Joi.object({
  scope: Joi.string().valid('platform', 'organization', 'user').required(),
  recipientIds: Joi.array().items(Joi.string().hex().length(24)).when('scope', {
    is: 'user',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  organizationId: Joi.string().hex().length(24).when('scope', {
    is: 'organization',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  category: Joi.string().valid(...Object.values(NOTIFICATION_CATEGORIES)).default(NOTIFICATION_CATEGORIES.INFO),
  title: Joi.string().max(200).required(),
  body: Joi.string().max(1000).allow('').default(''),
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