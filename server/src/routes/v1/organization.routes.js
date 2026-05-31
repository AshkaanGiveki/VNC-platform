const router = require('express').Router();
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const orgValidator = require('../../validators/organization.validator');
const orgController = require('../../controllers/organization.controller');
const { ROLES } = require('../../utils/constants');

// All routes require superadmin
router.use(authenticate, authorize(ROLES.SUPERADMIN));

router.post('/', validate({ body: orgValidator.createBody }), orgController.create);
// Combined: create org + optional admin user
router.post(
  '/with-admin',
  validate({ body: orgValidator.createBodyWithAdmin }), // we'll define this validator
  orgController.createWithAdmin
);
router.get('/', validate({ query: orgValidator.queryParams }), orgController.getAll);
router.get('/:id', validate({ params: orgValidator.orgIdParam }), orgController.getById);
router.put('/:id', validate({ params: orgValidator.orgIdParam, body: orgValidator.updateBody }), orgController.update);
router.delete('/:id', validate({ params: orgValidator.orgIdParam }), orgController.remove);
router.post(
  '/with-manager',
  authenticate, authorize(ROLES.SUPERADMIN),
  validate({ body: orgValidator.createBodyWithManager }),
  orgController.createWithManager
);

module.exports = router;