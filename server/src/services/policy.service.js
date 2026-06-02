/**
 * Policy service – CRUD for policy templates and default policy management.
 * @module services/policy.service
 */
const PolicyTemplate = require('../models/PolicyTemplate');
const Organization = require('../models/Organization');
const { NotFoundError, AuthorizationError, ConflictError } = require('../utils/errors');
const { ROLES } = require('../utils/constants');
const { logAction } = require('./log.service');
const logger = require('../utils/logger');

/**
 * Create a new policy template.
 * @param {object} params
 * @param {object} params.actor
 * @param {string} params.organizationId
 * @param {object} params.data - { name, description, options, isDefault? }
 * @returns {Promise<object>}
 */
async function createTemplate({ actor, organizationId, data }) {
  if (![ROLES.ORG_ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER].includes(actor.role)) {
    throw new AuthorizationError('Only admins & managers can create policy templates');
  }

  const template = await PolicyTemplate.create({
    ...data,
    organizationId,
  });

  logger.info(`Policy template created: ${template.name}`);
  await logAction({
    action: 'policyTemplate.created',
    resource: 'policyTemplate',
    resourceId: template._id,
    userId: actor.userId,
    organizationId,
  });

  return template;
}

/**
 * List all templates for an organization.
 * @param {string} organizationId
 * @returns {Promise<Array>}
 */
async function listTemplates(organizationId) {
  return PolicyTemplate.find({ organizationId }).sort({ createdAt: -1 }).lean();
}

/**
 * Get a single template.
 * @param {string} templateId
 * @param {string} organizationId
 * @returns {Promise<object>}
 */
async function getTemplate(templateId, organizationId) {
  const template = await PolicyTemplate.findOne({ _id: templateId, organizationId });
  if (!template) throw new NotFoundError('Policy template not found');
  return template;
}

/**
 * Update a template.
 */
async function updateTemplate({ actor, templateId, organizationId, updates }) {
  if (![ROLES.ORG_ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER].includes(actor.role)) {
    throw new AuthorizationError('Only admins & managers can update policy templates');
  }

  const template = await PolicyTemplate.findOneAndUpdate(
    { _id: templateId, organizationId },
    updates,
    { new: true, runValidators: true }
  );
  if (!template) throw new NotFoundError('Policy template not found');

  logger.info(`Policy template updated: ${template.name}`);
  await logAction({
    action: 'policyTemplate.updated',
    resource: 'policyTemplate',
    resourceId: template._id,
    userId: actor.userId,
    organizationId,
  });

  return template;
}

/**
 * Delete a template (cannot delete if set as default).
 */
async function deleteTemplate({ actor, templateId, organizationId }) {
  if (![ROLES.ORG_ADMIN, ROLES.SUPERADMIN, , ROLES.MANAGER].includes(actor.role)) {
    throw new AuthorizationError('Only admins can delete policy templates');
  }

  const template = await PolicyTemplate.findOne({ _id: templateId, organizationId });
  if (!template) throw new NotFoundError('Policy template not found');
  if (template.isDefault) {
    throw new ConflictError('Cannot delete the default policy template. Set another as default first.');
  }

  await PolicyTemplate.findByIdAndDelete(templateId);   // ← fixed

  logger.info(`Policy template deleted: ${template.name}`);
  await logAction({
    action: 'policyTemplate.deleted',
    resource: 'policyTemplate',
    resourceId: template._id,
    userId: actor.userId,
    organizationId,
  });
}

/**
 * Set a template as the default for its organization.
 * The pre-save hook in the model handles unsetting others.
 */
async function setDefaultTemplate({ actor, templateId, organizationId }) {
  if (![ROLES.ORG_ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER].includes(actor.role)) {
    throw new AuthorizationError('Only admins & managers can change default policy');
  }

  const template = await PolicyTemplate.findOne({ _id: templateId, organizationId });
  if (!template) throw new NotFoundError('Policy template not found');

  template.isDefault = true;
  await template.save();

  logger.info(`Default policy set to: ${template.name}`);
  await logAction({
    action: 'policyTemplate.setDefault',
    resource: 'policyTemplate',
    resourceId: template._id,
    userId: actor.userId,
    organizationId,
  });

  return template;
}

module.exports = {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
};