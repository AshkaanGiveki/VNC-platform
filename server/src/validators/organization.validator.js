/**
 * Organization request validation schemas.
 * @module validators/organization.validator
 */
const Joi = require('joi');

const createBody = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .required(),
  domain: Joi.string()
    .trim()
    .lowercase()
    .optional(),
  defaultPolicy: Joi.object({
    filePersistence: Joi.boolean().default(false),
    clipboard: Joi.boolean().default(true),
    audio: Joi.boolean().default(true),
    webcam: Joi.boolean().default(false),
    microphone: Joi.boolean().default(false),
    downloadEnabled: Joi.boolean().default(false),
    uploadEnabled: Joi.boolean().default(true),
    maxSessionDuration: Joi.number().integer().min(0).default(0),
  }).optional(),
  settings: Joi.object({
    maxUsers: Joi.number().integer().min(1).default(100),
    maxSessionsPerUser: Joi.number().integer().min(1).default(5),
    recordingEnabled: Joi.boolean().default(false),
  }).optional(),
});

const createBodyWithAdmin = Joi.object({
  organization: createBody.required(),
  admin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().trim().max(50).required(),
    lastName: Joi.string().trim().max(50).required(),
  }).optional(),
});

const updateBody = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  domain: Joi.string().trim().lowercase().optional(),
  defaultPolicy: Joi.object({
    filePersistence: Joi.boolean().optional(),
    clipboard: Joi.boolean().optional(),
    audio: Joi.boolean().optional(),
    webcam: Joi.boolean().optional(),
    microphone: Joi.boolean().optional(),
    downloadEnabled: Joi.boolean().optional(),
    uploadEnabled: Joi.boolean().optional(),
    maxSessionDuration: Joi.number().integer().min(0).optional(),
  }).optional(),
  settings: Joi.object({
    maxUsers: Joi.number().integer().min(1).optional(),
    maxSessionsPerUser: Joi.number().integer().min(1).optional(),
    recordingEnabled: Joi.boolean().optional(),
  }).optional(),
}).min(1); // at least one field to update

const orgIdParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid organization ID',
  }),
});

const queryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

const createBodyWithManager = Joi.object({
  name: Joi.string().trim().max(100).required(),
  domain: Joi.string().trim().lowercase().optional(),
  defaultPolicy: Joi.object({
    filePersistence: Joi.boolean().default(false),
    clipboard: Joi.boolean().default(true),
    audio: Joi.boolean().default(true),
    webcam: Joi.boolean().default(false),
    microphone: Joi.boolean().default(false),
    downloadEnabled: Joi.boolean().default(false),
    uploadEnabled: Joi.boolean().default(true),
    maxSessionDuration: Joi.number().integer().min(0).default(0),
  }).optional(),
  settings: Joi.object({
    maxUsers: Joi.number().integer().min(1).default(100),
    maxSessionsPerUser: Joi.number().integer().min(1).default(5),
    recordingEnabled: Joi.boolean().default(false),
  }).optional(),
  manager: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().trim().max(50).required(),
    lastName: Joi.string().trim().max(50).required(),
  }).required(),
});

module.exports = {
  createBody,
  createBodyWithAdmin,
  updateBody,
  orgIdParam,
  queryParams,
  createBodyWithManager
};