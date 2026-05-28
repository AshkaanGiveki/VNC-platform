const { verifyAccessToken, isTokenBlacklisted } = require('../utils/token');
const User = require('../models/User');
const { AuthenticationError } = require('../utils/errors');
const logger = require('../utils/logger');

async function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. If no header, try cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    // Check blacklist
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    if (!user || !user.isActive) {
      throw new AuthenticationError('User no longer exists or is inactive');
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      throw new AuthenticationError('Password changed, please log in again');
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? user.organizationId.toString() : null,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    req.token = token;
    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return res.status(401).json({ success: false, message: err.message });
    }
    logger.error(`Auth middleware error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal authentication error' });
  }
}

module.exports = authenticate;