/**
 * Image controller – platform image management (superadmin).
 * @module controllers/image.controller
 */
const imageService = require('../services/image.service');
const { success, paginated } = require('../utils/response');

const listImages = async (req, res, next) => {
  try {
    const { images, meta } = await imageService.listImages(req.query);
    return paginated(res, images, meta);
  } catch (err) {
    next(err);
  }
};

const getImage = async (req, res, next) => {
  try {
    const image = await imageService.getImageById(req.params.id);
    return success(res, image);
  } catch (err) {
    next(err);
  }
};

const createImage = async (req, res, next) => {
  try {
    const image = await imageService.createImage(req.user, req.body);
    return success(res, image, 201);
  } catch (err) {
    next(err);
  }
};

const updateImage = async (req, res, next) => {
  try {
    const image = await imageService.updateImage(req.user, req.params.id, req.body);
    return success(res, image);
  } catch (err) {
    next(err);
  }
};

const toggleImageStatus = async (req, res, next) => {
  try {
    const image = await imageService.toggleImageStatus(req.user, req.params.id);
    return success(res, image);
  } catch (err) {
    next(err);
  }
};

module.exports = { listImages, getImage, createImage, updateImage, toggleImageStatus };