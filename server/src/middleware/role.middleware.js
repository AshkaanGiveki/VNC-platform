/**
 * Role‑based authorization middleware factory.
 * @module middleware/role
 */
const { AuthorizationError } = require('../utils/errors');
const { ROLES } = require('../utils/constants');

/**
 * Returns a middleware that checks if the user's role is in the allowed list.
 * @param  {...string} roles - Allowed roles (e.g., 'org_admin', 'superadmin')
 * @returns {function} Express middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
        console.log(roles);
        console.log("Authorize: " + req.user.role);
      return res.status(403).json({
        success: false,
        message: `Access denied: required roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = authorize;