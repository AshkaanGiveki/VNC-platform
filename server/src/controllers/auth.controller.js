const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password, organizationId } = req.body;
    const result = await authService.login(email, password, organizationId);

    // Set access & refresh tokens as cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: false,                 // frontend can read it if needed
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,         // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // res.cookie('accessToken', result.accessToken, {
    //   httpOnly: false,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'lax',                     // ← was 'strict'
    //   maxAge: 15 * 60 * 1000,
    // });
    // res.cookie('refreshToken', result.refreshToken, {
    //   httpOnly: false,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'lax',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

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

    // Clear cookies
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
    // TODO: implement password reset flow
    return success(res, { message: 'If the email exists, a reset link has been sent' }, 200);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    // TODO: implement
    return success(res, { message: 'Password reset successfully' }, 200);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    // req.user is attached by authenticate middleware
    return success(res, { user: req.user }, 200);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refreshToken, logout, forgotPassword, resetPassword, me };