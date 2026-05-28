/**
 * Organization service – CRUD and default policy management for tenants.
 * @module services/organization.service
 */
const Organization = require('../models/Organization');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Create a new organization.
 * @param {object} data - { name, domain?, defaultPolicy?, settings? }
 * @returns {Promise<object>} Created organization document.
 */
async function createOrganization(data) {
  const existing = await Organization.findOne({ name: data.name });
  if (existing) {
    throw new ConflictError('An organization with this name already exists');
  }

  const org = await Organization.create(data);
  logger.info(`Organization created: ${org.name} (${org._id})`);
  return org;
}

/**
 * Get all organizations (superadmin).
 * @returns {Promise<Array>}
 */
async function getAllOrganizations() {
  return Organization.find().sort({ createdAt: -1 });
}

/**
 * Get a single organization by ID.
 * @param {string} orgId
 * @returns {Promise<object>}
 * @throws {NotFoundError}
 */
async function getOrganizationById(orgId) {
  const org = await Organization.findById(orgId);
  if (!org) throw new NotFoundError('Organization not found');
  return org;
}

/**
 * Update organization details.
 * @param {string} orgId
 * @param {object} updates - Fields to update (name, domain, defaultPolicy, settings)
 * @returns {Promise<object>} Updated organization.
 */
async function updateOrganization(orgId, updates) {
  const org = await Organization.findByIdAndUpdate(orgId, updates, {
    new: true,
    runValidators: true,
  });
  if (!org) throw new NotFoundError('Organization not found');
  logger.info(`Organization updated: ${org._id}`);
  return org;
}

/**
 * Soft‑delete an organization (set active flag if we had one; here we use hard delete for simplicity,
 * but in enterprise we'd deactivate). This implementation physically removes it.
 * @param {string} orgId
 * @returns {Promise<void>}
 */
async function deleteOrganization(orgId) {
  const org = await Organization.findByIdAndDelete(orgId);
  if (!org) throw new NotFoundError('Organization not found');
  logger.warn(`Organization deleted: ${org.name} (${orgId})`);
}

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
};