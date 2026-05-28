const router = require('express').Router({ mergeParams: true });
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const resolveOrg = require('../../middleware/organization.middleware');
const validate = require('../../middleware/validate.middleware');
const workspaceValidator = require('../../validators/workspace.validator');
const workspaceController = require('../../controllers/workspace.controller');
const { ROLES } = require('../../utils/constants');

router.use(authenticate, resolveOrg);

router.post('/', authorize(ROLES.ORG_ADMIN, ROLES.MANAGER), validate({ body: workspaceValidator.createBody }), workspaceController.createWorkspace);
router.get('/', validate({ query: workspaceValidator.queryParams }), workspaceController.listWorkspaces);
router.get('/:id', validate({ params: workspaceValidator.workspaceIdParam }), workspaceController.getWorkspace);
router.put('/:id', authorize(ROLES.ORG_ADMIN, ROLES.MANAGER), validate({ params: workspaceValidator.workspaceIdParam, body: workspaceValidator.updateBody }), workspaceController.updateWorkspace);
router.delete('/:id', authorize(ROLES.ORG_ADMIN, ROLES.MANAGER), validate({ params: workspaceValidator.workspaceIdParam }), workspaceController.deleteWorkspace);

// Assign/revoke
router.post('/:id/assign', authorize(ROLES.ORG_ADMIN, ROLES.MANAGER), validate({ params: workspaceValidator.workspaceIdParam, body: workspaceValidator.assignBody || require('../../validators/workspace.validator').assignBody }), workspaceController.assignWorkspace);
// Need assignBody validator – we'll add it to workspace.validator
router.delete('/:id/assign/:userId', authorize(ROLES.ORG_ADMIN, ROLES.MANAGER), validate({ params: workspaceValidator.workspaceIdParam }), workspaceController.revokeWorkspace);

module.exports = router;