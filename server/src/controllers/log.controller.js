/**
 * Log controller – read-only audit log access (admin only).
 * @module controllers/log.controller
 */
const Log = require('../models/Log');
const { paginated } = require('../utils/response');
const { ROLES } = require('../utils/constants');

const getLogs = async (req, res, next) => {
  try {
    const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
    const pagination = parsePagination(req.query);
    const filter = {};

    // Superadmin sees all; org admin sees own org; others forbidden via middleware
    if (req.user.role === ROLES.ORG_ADMIN) {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === ROLES.SUPERADMIN && req.query.orgId) {
      filter.organizationId = req.query.orgId;
    }

    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.resource) filter.resource = req.query.resource;
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
    }

    const [logs, total] = await Promise.all([
      applyPagination(
        Log.find(filter).sort({ timestamp: -1 }),
        pagination
      ).lean(),
      Log.countDocuments(filter),
    ]);

    return paginated(res, logs, buildMeta(total, pagination));
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs };