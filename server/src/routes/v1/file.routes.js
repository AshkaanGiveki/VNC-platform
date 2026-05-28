const router = require('express').Router({ mergeParams: true }); // :sessionId from parent
const authenticate = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const fileValidator = require('../../validators/file.validator');
const fileController = require('../../controllers/file.controller');
const multer = require('multer');

// Configure multer for memory storage (file goes directly to object storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    // Allow only specific types? We'll let all, but could restrict.
    cb(null, true);
  },
});

router.use(authenticate);

router.post('/upload', upload.single('file'), validate({ params: fileValidator.sessionIdParam }), fileController.uploadFile);
router.get('/', validate({ params: fileValidator.sessionIdParam, query: fileValidator.queryParams }), fileController.listFiles);
router.get('/:fileId/download', validate({ params: fileValidator.fileIdParam }), fileController.downloadFile);
router.delete('/:fileId', validate({ params: fileValidator.fileIdParam }), fileController.deleteFile);

module.exports = router;