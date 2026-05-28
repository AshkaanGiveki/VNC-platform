/**
 * JWT utilities – sign, verify, refresh, and blacklist tokens using Redis.
 * Access tokens are short‑lived; refresh tokens are longer‑lived and rotated.
 * @module utils/token
 */
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../config/redis');
const { AuthenticationError } = require('./errors');
const config = require('../config'); // we can also import directly from config/index

// Load env values from the already‑frozen config
const { secret, refreshSecret, accessExpiresIn, refreshExpiresIn } = config.env.jwt;

/**
 * Sign a new access token.
 * @param {object} payload – must contain at least `userId`, `role`, `organizationId`.
 * @returns {string} JWT access token.
 */
function signAccessToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: accessExpiresIn });
}

/**
 * Sign a new refresh token.
 * @param {object} payload – must contain at least `userId`, `role`, `organizationId`.
 * @returns {string} JWT refresh token.
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn });
}

/**
 * Verify an access token.
 * @param {string} token – JWT access token.
 * @returns {object} Decoded payload.
 * @throws {AuthenticationError} If token is invalid or expired.
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new AuthenticationError('Invalid or expired access token');
  }
}

/**
 * Verify a refresh token.
 * @param {string} token – JWT refresh token.
 * @returns {object} Decoded payload.
 * @throws {AuthenticationError} If token is invalid or expired.
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, refreshSecret);
  } catch (err) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }
}

/**
 * Blacklist a token (e.g., after logout) by storing its JTI in Redis.
 * The token's expiration is extracted from its payload so that the Redis key
 * auto‑expires when the token becomes irrelevant.
 * @param {string} token – the JWT token to blacklist.
 * @returns {Promise<void>}
 */
async function blacklistToken(token) {
  let decoded;
  try {
    decoded = jwt.decode(token);
  } catch (err) {
    // If we can't decode, we can't blacklist, but we don't want to throw.
    return;
  }
  if (!decoded || !decoded.jti) return;

  const now = Math.floor(Date.now() / 1000);
  const ttl = decoded.exp ? decoded.exp - now : 0;
  if (ttl > 0) {
    // Store in Redis with a key of "blacklist:<jti>" and TTL equal to remaining lifetime
    await redisClient.set(`blacklist:${decoded.jti}`, '1', 'EX', ttl);
  }
}

/**
 * Check if a token has been blacklisted.
 * @param {string} token – the JWT to check.
 * @returns {Promise<boolean>} true if blacklisted.
 */
async function isTokenBlacklisted(token) {
  let decoded;
  try {
    decoded = jwt.decode(token);
  } catch (err) {
    return false;
  }
  if (!decoded || !decoded.jti) return false;
  const exists = await redisClient.exists(`blacklist:${decoded.jti}`);
  return exists === 1;
}

/**
 * Generate a token payload with a unique JTI.
 * @param {object} user – user object (at least _id, role, organizationId).
 * @returns {object} Payload suitable for signing.
 */
function generatePayload(user) {
  return {
    userId: user._id.toString(),
    role: user.role,
    organizationId: user.organizationId ? user.organizationId.toString() : null,
    jti: uuidv4(), // unique token identifier
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
  generatePayload,
};