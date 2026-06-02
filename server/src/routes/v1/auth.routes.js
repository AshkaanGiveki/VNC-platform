const router = require('express').Router();
const validate = require('../../middleware/validate.middleware');
const authValidator = require('../../validators/auth.validator');
const authController = require('../../controllers/auth.controller');
const { generateCsrfToken } = require('../../middleware/csrf.middleware');

// Public routes
router.post('/login', validate({ body: authValidator.loginBody }), authController.login);
router.post('/refresh', validate({ body: authValidator.refreshBody }), authController.refreshToken);
router.post('/forgot-password', validate({ body: authValidator.forgotPasswordBody }), authController.forgotPassword);
router.post('/reset-password', validate({ body: authValidator.resetPasswordBody }), authController.resetPassword);
// Get CSRF token (call after login)
router.get('/csrf-token', generateCsrfToken, (req, res) => {
  res.json({ success: true, token: req.csrfToken });
});

// Authenticated route – logout
const authenticate = require('../../middleware/auth.middleware');
router.post('/change-password', authenticate, validate({ body: authValidator.changePasswordBody }), authController.changePassword);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);          // ← new
module.exports = router;