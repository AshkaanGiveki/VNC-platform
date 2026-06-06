const router = require('express').Router({ mergeParams: true });
const authenticate = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const fileValidator = require('../../validators/file.validator');
const fileController = require('../../controllers/file.controller');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => { cb(null, true); },
});

// All file routes require authentication
router.use(authenticate);

// Uploaded files (MinIO)
router.post('/upload', upload.single('file'), validate({ params: fileValidator.sessionIdParam }), fileController.uploadFile);
router.get('/uploads', validate({ params: fileValidator.sessionIdParam, query: fileValidator.queryParams }), fileController.listUploads);
router.get('/uploads/:fileId/download', validate({ params: fileValidator.fileIdParam }), fileController.downloadFile);
router.delete('/uploads/:fileId', validate({ params: fileValidator.fileIdParam }), fileController.deleteFile);

// Container Downloads folder
router.get('/downloads', validate({ params: fileValidator.sessionIdParam }), fileController.listDownloads);
router.get('/downloads/:fileName', validate({ params: fileValidator.sessionIdParam }), fileController.downloadContainerFile);

module.exports = router;