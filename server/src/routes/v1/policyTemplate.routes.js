const router = require('express').Router({ mergeParams: true });
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const resolveOrg = require('../../middleware/organization.middleware');
const validate = require('../../middleware/validate.middleware');
const policyValidator = require('../../validators/policy.validator');
const policyController = require('../../controllers/policyTemplate.controller');
const { ROLES } = require('../../utils/constants');

router.use(authenticate, resolveOrg);

router.post(
  '/',
  authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER),   // ← ADD ROLES.MANAGER
  validate({ body: policyValidator.createBody }),
  policyController.createTemplate
);
router.get('/', validate({ query: policyValidator.queryParams }), policyController.listTemplates);
router.get('/:id', validate({ params: policyValidator.templateIdParam }), policyController.getTemplate);
router.put(
  '/:id',
  authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER),   // ← ADD ROLES.MANAGER
  validate({ params: policyValidator.templateIdParam, body: policyValidator.updateBody }),
  policyController.updateTemplate
);
router.delete(
  '/:id',
  authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER),   // ← ADD ROLES.MANAGER
  validate({ params: policyValidator.templateIdParam }),
  policyController.deleteTemplate
);
router.post(
  '/:id/set-default',
  authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER),   // ← ADD ROLES.MANAGER
  validate({ params: policyValidator.templateIdParam }),
  policyController.setDefaultTemplate
);

module.exports = router;