const User = require('../models/User');
const Organization = require('../models/Organization');
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    blacklistToken,
    generatePayload,
} = require('../utils/token');
const { AuthenticationError } = require('../utils/errors');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { sendResetEmail } = require('./email.service');

async function login(email, password, organizationId = null) {
    const query = { email: email.toLowerCase(), isActive: true };
    if (organizationId) {
        query.organizationId = organizationId;
    }

    const user = await User.findOne(query).select('+password');
    if (!user) throw new AuthenticationError('Invalid credentials');

    // If user belongs to an organization, check that the org is active
    if (user.organizationId) {
        const org = await Organization.findById(user.organizationId).lean();
        if (!org || !org.isActive) {
            throw new AuthenticationError('Organization is disabled. Contact your administrator.');
        }
    }

    if (!user.isActive) {
        throw new AuthenticationError('Your account has been blocked. Contact your administrator.');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AuthenticationError('Invalid credentials');

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const payload = generatePayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;

    return { accessToken, refreshToken, user: userObj };
}

async function refreshAccessToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+password');
    if (!user || !user.isActive) throw new AuthenticationError('User no longer exists');

    // Check organization is active
    if (user.organizationId) {
        const org = await Organization.findById(user.organizationId).lean();
        if (!org || !org.isActive) {
            throw new AuthenticationError('Organization is disabled.');
        }
    }
    if (user.changedPasswordAfter(decoded.iat)) {
        throw new AuthenticationError('Password changed, please log in again');
    }

    await blacklistToken(refreshToken);

    const payload = generatePayload(user);
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function logout(accessToken, refreshToken) {
    await Promise.all([blacklistToken(accessToken), blacklistToken(refreshToken)]);
}


async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!user) return; // always return success to avoid email enumeration

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save({ validateBeforeSave: false });

  await sendResetEmail(email, token);
}

async function resetPassword(token, newPassword) {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
    isActive: true,
  });
  if (!user) throw new AuthenticationError('Invalid or expired reset token');

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
}

module.exports = { login, refreshAccessToken, logout, forgotPassword, resetPassword };