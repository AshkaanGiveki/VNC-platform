/**
 * Authentication request validation schemas.
 * @module validators/auth.validator
 */
const Joi = require('joi');

const loginBody = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'A valid email is required',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({ 'any.required': 'Password is required' }),
  organizationId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .messages({ 'string.hex': 'Invalid organization ID' }),
});

const refreshBody = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({ 'any.required': 'Refresh token is required' }),
});

const forgotPasswordBody = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordBody = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({ 'string.min': 'Password must be at least 8 characters' }),
});

module.exports = {
  loginBody,
  refreshBody,
  forgotPasswordBody,
  resetPasswordBody,
};