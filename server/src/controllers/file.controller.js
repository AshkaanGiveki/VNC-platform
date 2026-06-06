/**
 * File controller – upload, download, list, delete session files.
 * @module controllers/file.controller
 */
const fileService = require('../services/file.service');
const { success, paginated } = require('../utils/response');

const uploadFile = async (req, res, next) => {
  try {
    // req.file is populated by multer middleware (we'll configure later)
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }
    const file = await fileService.uploadToSession({
      user: req.user,
      sessionId: req.params.sessionId,
      file: req.file,
      ip: req.ip,
    });
    return success(res, file, 201);
  } catch (err) {
    next(err);
  }
};

const listFiles = async (req, res, next) => {
  try {
    const { files, meta } = await fileService.listSessionFiles({
      sessionId: req.params.sessionId,
      user: req.user,
      queryParams: req.query,
    });
    return paginated(res, files, meta);
  } catch (err) {
    next(err);
  }
};

// const downloadFile = async (req, res, next) => {
//   try {
//     const url = await fileService.downloadFile({
//       fileId: req.params.fileId,
//       user: req.user,
//       sessionId: req.params.sessionId,
//     });
//     // Redirect to pre-signed URL
//     return res.redirect(url);
//   } catch (err) {
//     next(err);
//   }
// };

const downloadFile = async (req, res, next) => {
  try {
    const url = await fileService.downloadUploadedFile({
      fileId: req.params.fileId,
      user: req.user,
      sessionId: req.params.sessionId,
    });
    return res.redirect(url);
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    await fileService.deleteSessionFile({
      fileId: req.params.fileId,
      user: req.user,
      sessionId: req.params.sessionId,
    });
    return success(res, null, 204);
  } catch (err) {
    next(err);
  }
};

const listDownloads = async (req, res, next) => {
  try {
    const files = await fileService.listDownloads({
      user: req.user,
      sessionId: req.params.sessionId,
    });
    return success(res, files);
  } catch (err) {
    next(err);
  }
};

const downloadContainerFile = async (req, res, next) => {
  try {
    const filePath = await fileService.downloadFromContainer({
      user: req.user,
      sessionId: req.params.sessionId,
      fileName: req.params.fileName,
    });
    res.download(filePath);
  } catch (err) {
    next(err);
  }
};

const listUploads = async (req, res, next) => {
  try {
    const { files, meta } = await fileService.listSessionFiles({
      sessionId: req.params.sessionId,
      user: req.user,
      queryParams: req.query,
    });
    return paginated(res, files, meta);
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadFile, listFiles, downloadFile, deleteFile, listDownloads, downloadContainerFile, listUploads};