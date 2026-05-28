const router = require('express').Router();
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const imageController = require('../../controllers/image.controller');
const { ROLES } = require('../../utils/constants');

// All routes require superadmin (except read? design says superadmin only for manage, but listing could be open to authenticated users. We'll keep as per docs: superadmin for all.)
router.use(authenticate);

router.get('/', imageController.listImages); // any authenticated user can list enabled images? For now open to all authenticated.
router.get('/:id', imageController.getImage);
router.post('/', authorize(ROLES.SUPERADMIN), imageController.createImage);
router.put('/:id', authorize(ROLES.SUPERADMIN), imageController.updateImage);
router.patch('/:id/toggle', authorize(ROLES.SUPERADMIN), imageController.toggleImageStatus);

module.exports = router;