/**
 * Organization resolution middleware.
 * Attaches `req.organization` from the :orgId route parameter and
 * ensures the authenticated user belongs to that organization (unless superadmin).
 * Also populates organization settings used in other middlewares.
 * @module middleware/organization
 */
const Organization = require('../models/Organization');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { ROLES } = require('../utils/constants');
const logger = require('../utils/logger');

async function resolveOrganization(req, res, next) {
  try {
    const orgId = req.params.orgId;
    if (!orgId) {
      return next(); // no org required, skip
    }

    const org = await Organization.findById(orgId).lean();
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    // If the user is a superadmin, allow without membership check
    if (req.user && req.user.role === ROLES.SUPERADMIN) {
      req.organization = org;
      return next();
    }

    // For non‑superadmins, ensure they belong to the organization
    if (!req.user || req.user.organizationId !== orgId) {
      throw new AuthorizationError('You do not belong to this organization');
    }

    req.organization = org;
    next();
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err instanceof AuthorizationError) {
      return res.status(403).json({ success: false, message: err.message });
    }
    logger.error(`Organization middleware error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
}

module.exports = resolveOrganization;