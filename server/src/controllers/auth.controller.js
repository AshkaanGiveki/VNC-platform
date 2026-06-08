const authService = require('../services/auth.service');
const User = require('../models/User');
const { success } = require('../utils/response');
const { AuthenticationError, NotFoundError } = require('../utils/errors');

const login = async (req, res, next) => {
  try {
    const { email, password, organizationId } = req.body;
    const result = await authService.login(email, password, organizationId);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, result, 200);
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    return success(res, tokens, 200);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const accessToken = req.token;
    const { refreshToken } = req.body;
    await authService.logout(accessToken, refreshToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('csrf-token');

    return success(res, { message: 'Logged out successfully' }, 200);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    return success(res, { message: 'If the email exists, a reset link has been sent' });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    return success(res, { message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    return success(res, { user: req.user }, 200);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) throw new NotFoundError('User not found');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AuthenticationError('Current password is incorrect');
    user.password = newPassword;
    await user.save();
    return success(res, { message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refreshToken, logout, forgotPassword, resetPassword, me, changePassword };