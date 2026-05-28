const User = require('../models/User');
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    blacklistToken,
    generatePayload,
} = require('../utils/token');
const { AuthenticationError } = require('../utils/errors');
const logger = require('../utils/logger');

async function login(email, password, organizationId = null) {
    const query = { email: email.toLowerCase(), isActive: true };
    if (organizationId) {
        query.organizationId = organizationId;
    }
    // If no organizationId provided, we search across all orgs (superadmin has organizationId null)

    const user = await User.findOne(query).select('+password');
    if (!user) throw new AuthenticationError('Invalid credentials');

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

module.exports = { login, refreshAccessToken, logout };