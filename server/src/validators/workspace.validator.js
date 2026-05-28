/**
 * Workspace request validation schemas.
 * @module validators/workspace.validator
 */
const Joi = require('joi');

const createBody = Joi.object({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().max(500).allow('').default(''),
  imageId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid image ID',
  }),
  resources: Joi.object({
    cpu: Joi.number().min(0.1).default(1).required(),
    memory: Joi.number().integer().min(128).default(1024).required(),
    disk: Joi.number().integer().min(1).default(10).required(),
  }).required(),
  policy: Joi.object({
    templateId: Joi.string().hex().length(24).optional().allow(null),
    overrides: Joi.object({
      filePersistence: Joi.boolean().optional(),
      clipboard: Joi.boolean().optional(),
      audio: Joi.boolean().optional(),
      webcam: Joi.boolean().optional(),
      microphone: Joi.boolean().optional(),
      downloadEnabled: Joi.boolean().optional(),
      uploadEnabled: Joi.boolean().optional(),
      maxSessionDuration: Joi.number().integer().min(0).optional(),
    }).default({}),
  }).default({}),
  isActive: Joi.boolean().default(true),
});

const updateBody = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  description: Joi.string().max(500).optional(),
  imageId: Joi.string().hex().length(24).optional(),
  resources: Joi.object({
    cpu: Joi.number().min(0.1).optional(),
    memory: Joi.number().integer().min(128).optional(),
    disk: Joi.number().integer().min(1).optional(),
  }).optional(),
  policy: Joi.object({
    templateId: Joi.string().hex().length(24).optional().allow(null),
    overrides: Joi.object({
      filePersistence: Joi.boolean().optional(),
      clipboard: Joi.boolean().optional(),
      audio: Joi.boolean().optional(),
      webcam: Joi.boolean().optional(),
      microphone: Joi.boolean().optional(),
      downloadEnabled: Joi.boolean().optional(),
      uploadEnabled: Joi.boolean().optional(),
      maxSessionDuration: Joi.number().integer().min(0).optional(),
    }).optional(),
  }).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

// NEW: schema for assigning a workspace to a user
const assignBody = Joi.object({
  userId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid user ID',
  }),
});

const workspaceIdParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid workspace ID',
  }),
});

const queryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  imageId: Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  createBody,
  updateBody,
  assignBody,          // ← exported
  workspaceIdParam,
  queryParams,
};