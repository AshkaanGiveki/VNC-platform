const router = require('express').Router({ mergeParams: true });
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const resolveOrg = require('../../middleware/organization.middleware');
const validate = require('../../middleware/validate.middleware');
const userValidator = require('../../validators/user.validator');
const userController = require('../../controllers/user.controller');
const { ROLES } = require('../../utils/constants');

// All routes require auth and organization resolution
router.use(authenticate, resolveOrg);

// Superadmin, org_admin, and manager can create users
// POST – create user
router.post(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER),
  validate({ body: userValidator.createBody }),
  userController.createUser
);

router.get(
  '/',
  validate({ query: userValidator.queryParams }),
  userController.listUsers
);

router.get('/all', authenticate, authorize(ROLES.SUPERADMIN), validate({ query: userValidator.queryParams }), userController.getAllUsers);

router.get(
  '/:userId',
  validate({ params: userValidator.userIdParam }),
  userController.getUser
);

// Superadmin, org_admin, and manager can update/delete users
router.put(
  '/:userId',
  authorize(ROLES.SUPERADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER),
  validate({ params: userValidator.userIdParam, body: userValidator.updateBody }),
  userController.updateUser
);

router.delete(
  '/:userId',
  authorize(ROLES.SUPERADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER),
  validate({ params: userValidator.userIdParam }),
  userController.deleteUser
);

router.get(
    '/me/workspaces', 
    userController.getMyWorkspaces
);

module.exports = router;