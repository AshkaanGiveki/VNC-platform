/**
 * Image service – management of platform images (superadmin only).
 * @module services/image.service
 */
const Image = require('../models/Image');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { ROLES } = require('../utils/constants');
const { logAction } = require('./log.service');
const logger = require('../utils/logger');

/**
 * List all images, optionally filtered by enabled status.
 * @param {object} query - { isEnabled, type, page, limit }
 * @returns {Promise<{images: Array, meta: object}>}
 */
async function listImages(query) {
  const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
  const pagination = parsePagination(query);

  const filter = {};
  if (query.isEnabled !== undefined) filter.isEnabled = query.isEnabled === 'true';
  if (query.type) filter.type = query.type;

  const [images, total] = await Promise.all([
    applyPagination(Image.find(filter), pagination).lean(),
    Image.countDocuments(filter),
  ]);

  return { images, meta: buildMeta(total, pagination) };
}

/**
 * Get a single image by ID.
 * @param {string} imageId
 * @returns {Promise<object>}
 */
async function getImageById(imageId) {
  const image = await Image.findById(imageId);
  if (!image) throw new NotFoundError('Image not found');
  return image;
}

/**
 * Create a new image (superadmin only).
 * @param {object} actor
 * @param {object} imageData
 * @returns {Promise<object>}
 */
async function createImage(actor, imageData) {
  if (actor.role !== ROLES.SUPERADMIN) {
    throw new AuthorizationError('Only superadmins can manage images');
  }

  const image = await Image.create(imageData);
  logger.info(`Image created: ${image.name}`);

  await logAction({
    action: 'image.created',
    resource: 'image',
    resourceId: image._id,
    userId: actor.userId,
    details: { name: image.name },
  });

  return image;
}

/**
 * Update an image.
 * @param {object} actor
 * @param {string} imageId
 * @param {object} updates
 * @returns {Promise<object>}
 */
async function updateImage(actor, imageId, updates) {
  if (actor.role !== ROLES.SUPERADMIN) {
    throw new AuthorizationError('Only superadmins can manage images');
  }

  const image = await Image.findByIdAndUpdate(imageId, updates, { new: true, runValidators: true });
  if (!image) throw new NotFoundError('Image not found');

  logger.info(`Image updated: ${image.name}`);
  await logAction({
    action: 'image.updated',
    resource: 'image',
    resourceId: image._id,
    userId: actor.userId,
  });

  return image;
}

/**
 * Toggle image enabled status.
 * @param {object} actor
 * @param {string} imageId
 * @returns {Promise<object>}
 */
async function toggleImageStatus(actor, imageId) {
  if (actor.role !== ROLES.SUPERADMIN) {
    throw new AuthorizationError('Only superadmins can manage images');
  }

  const image = await Image.findById(imageId);
  if (!image) throw new NotFoundError('Image not found');

  image.isEnabled = !image.isEnabled;
  await image.save();

  logger.info(`Image ${image.name} ${image.isEnabled ? 'enabled' : 'disabled'}`);
  await logAction({
    action: 'image.toggled',
    resource: 'image',
    resourceId: image._id,
    userId: actor.userId,
    details: { isEnabled: image.isEnabled },
  });

  return image;
}

module.exports = { listImages, getImageById, createImage, updateImage, toggleImageStatus };