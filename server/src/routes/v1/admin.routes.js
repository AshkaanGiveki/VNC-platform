const router = require('express').Router();
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const userValidator = require('../../validators/user.validator');
const userController = require('../../controllers/user.controller');
const { ROLES } = require('../../utils/constants');

router.get(
  '/all',
  authenticate,
  authorize(ROLES.SUPERADMIN),
  validate({ query: userValidator.queryParams }),
  userController.getAllUsers
);

module.exports = router;