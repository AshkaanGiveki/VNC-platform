/**
 * Notification controller – user notification access and admin creation.
 * @module controllers/notification.controller
 */
const Notification = require('../models/Notification');
const { success, paginated } = require('../utils/response');
const notificationService = require('../services/notification.service');

const markAsRead = async (req, res, next) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, recipientIds: req.user.userId },
      { $addToSet: { readBy: { userId: req.user.userId, readAt: new Date() } } }
    );
    return success(res, { message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientIds: req.user.userId, 'readBy.userId': { $ne: req.user.userId } },
      { $addToSet: { readBy: { userId: req.user.userId, readAt: new Date() } } }
    );
    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

const createNotification = async (req, res, next) => {
  // Admin-only endpoint to manually send notifications
  if (req.user.role === ROLES.ORG_ADMIN && (req.body.scope === 'admins')) {
    return res.status(403).json({ success: false, message: 'Admins cannot send to admins scope' });
  }
  try {
    await notificationService.createNotification(req.body);
    return success(res, { message: 'Notification created' }, 201);
  } catch (err) {
    next(err);
  }
};

const getUserNotifications = async (req, res, next) => {
  try {
    const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
    const pagination = parsePagination(req.query);
    const filter = { recipientIds: req.user.userId };

    if (req.query.unreadOnly === 'true') {
      filter['readBy.userId'] = { $ne: req.user.userId };
    }
    if (req.query.category) filter.category = req.query.category;

    const [notifications, total] = await Promise.all([
      applyPagination(
        Notification.find(filter).sort({ createdAt: -1 }).select('-recipientIds'),
        pagination
      ).lean(),
      Notification.countDocuments(filter),
    ]);

    return paginated(res, notifications, buildMeta(total, pagination));
  } catch (err) {
    next(err);
  }
};

// Superadmin sees all platform‑scoped notifications (not user‑specific)
const getAdminNotifications = async (req, res, next) => {
  try {
    const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
    const pagination = parsePagination(req.query);
    const filter = { scope: 'platform' };

    if (req.query.unreadOnly === 'true') {
      filter['readBy.userId'] = { $ne: req.user.userId };
    }
    if (req.query.category) filter.category = req.query.category;

    const [notifications, total] = await Promise.all([
      applyPagination(
        Notification.find(filter).sort({ createdAt: -1 }).select('-recipientIds'),
        pagination
      ).lean(),
      Notification.countDocuments(filter),
    ]);

    return paginated(res, notifications, buildMeta(total, pagination));
  } catch (err) {
    next(err);
  }
};

// Manager sees organization‑level notifications
const getOrgNotifications = async (req, res, next) => {
  try {
    const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
    const pagination = parsePagination(req.query);
    const filter = {
      scope: 'organization',
      organizationId: req.user.organizationId,
    };

    if (req.query.unreadOnly === 'true') {
      filter['readBy.userId'] = { $ne: req.user.userId };
    }
    if (req.query.category) filter.category = req.query.category;

    const [notifications, total] = await Promise.all([
      applyPagination(
        Notification.find(filter).sort({ createdAt: -1 }).select('-recipientIds'),
        pagination
      ).lean(),
      Notification.countDocuments(filter),
    ]);

    return paginated(res, notifications, buildMeta(total, pagination));
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserNotifications, getAdminNotifications, getOrgNotifications, markAsRead, markAllRead, createNotification };
