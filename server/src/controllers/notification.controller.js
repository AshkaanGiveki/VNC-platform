// const Notification = require('../models/Notification');
// const { success, paginated } = require('../utils/response');
// const notificationService = require('../services/notification.service');
// const { ROLES } = require('../utils/constants');

// // Helper: returns a sanitized copy with isRead and without readBy
// function sanitize(notification, userId) {
//   const n = { ...notification };
//   n.isRead = n.readBy?.some((r) => r.userId.toString() === userId) || false;
//   delete n.readBy;
//   return n;
// }

// const getUserNotifications = async (req, res, next) => {
//   try {
//     const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
//     const pagination = parsePagination(req.query);
//     const filter = { recipientIds: req.user.userId };
//     if (req.query.unreadOnly === 'true') {
//       filter['readBy.userId'] = { $ne: req.user.userId };
//     }
//     if (req.query.category) filter.category = req.query.category;

//     const [notifications, total] = await Promise.all([
//       applyPagination(
//         Notification.find(filter).sort({ createdAt: -1 }).lean(),
//         pagination
//       ),
//       Notification.countDocuments(filter),
//     ]);

//     const sanitized = notifications.map((n) => sanitize(n, req.user.userId));
//     return paginated(res, sanitized, buildMeta(total, pagination));
//   } catch (err) {
//     next(err);
//   }
// };

// // const getAdminNotifications = async (req, res, next) => {
// //   try {
// //     const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
// //     const pagination = parsePagination(req.query);
// //     const filter = { scope: 'platform' };
// //     if (req.query.unreadOnly === 'true') {
// //       filter['readBy.userId'] = { $ne: req.user.userId };
// //     }
// //     if (req.query.category) filter.category = req.query.category;

// //     const [notifications, total] = await Promise.all([
// //       applyPagination(
// //         Notification.find(filter).sort({ createdAt: -1 }).lean(),
// //         pagination
// //       ),
// //       Notification.countDocuments(filter),
// //     ]);

// //     const sanitized = notifications.map((n) => sanitize(n, req.user.userId));
// //     return paginated(res, sanitized, buildMeta(total, pagination));
// //   } catch (err) {
// //     next(err);
// //   }
// // };

// // const getOrgNotifications = async (req, res, next) => {
// //   try {
// //     const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
// //     const pagination = parsePagination(req.query);
// //     const filter = {
// //       scope: 'organization',
// //       organizationId: req.user.organizationId,
// //     };
// //     if (req.query.unreadOnly === 'true') {
// //       filter['readBy.userId'] = { $ne: req.user.userId };
// //     }
// //     if (req.query.category) filter.category = req.query.category;

// //     const [notifications, total] = await Promise.all([
// //       applyPagination(
// //         Notification.find(filter).sort({ createdAt: -1 }).lean(),
// //         pagination
// //       ),
// //       Notification.countDocuments(filter),
// //     ]);

// //     const sanitized = notifications.map((n) => sanitize(n, req.user.userId));
// //     return paginated(res, sanitized, buildMeta(total, pagination));
// //   } catch (err) {
// //     next(err);
// //   }
// // };

// const markAsRead = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;
//     const notification = await Notification.findById(req.params.id);
//     if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

//     // Already read – do nothing
//     if (notification.readBy.some((r) => r.userId.toString() === userId)) {
//       return success(res, { message: 'Already marked as read' });
//     }

//     notification.readBy.push({ userId, readAt: new Date() });
//     await notification.save();
//     return success(res, { message: 'Marked as read' });
//   } catch (err) {
//     next(err);
//   }
// };

// const markAllRead = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;
//     const unread = await Notification.find({
//       recipientIds: userId,
//       'readBy.userId': { $ne: userId },
//     });

//     if (unread.length === 0) {
//       return success(res, { message: 'All already read' });
//     }

//     const bulkOps = unread.map((n) => ({
//       updateOne: {
//         filter: { _id: n._id },
//         update: { $push: { readBy: { userId, readAt: new Date() } } },
//       },
//     }));
//     await Notification.bulkWrite(bulkOps);
//     return success(res, { message: 'All marked as read' });
//   } catch (err) {
//     next(err);
//   }
// };

// const createNotification = async (req, res, next) => {
//   if (req.user.role === ROLES.ORG_ADMIN && req.body.scope === 'admins') {
//     return res.status(403).json({ success: false, message: 'Admins cannot send to admins scope' });
//   }
//   try {
//     await notificationService.createNotification(req.body);
//     return success(res, { message: 'Notification created' }, 201);
//   } catch (err) {
//     next(err);
//   }
// };

// module.exports = {
//   getUserNotifications,
//   // getAdminNotifications,
//   // getOrgNotifications,
//   markAsRead,
//   markAllRead,
//   createNotification,
// };

const Notification = require('../models/Notification');
const { success, paginated } = require('../utils/response');
const notificationService = require('../services/notification.service');
const { ROLES } = require('../utils/constants');

// Helper: returns a sanitized copy with isRead and without readBy
function sanitize(notification, userId) {
  const n = { ...notification };
  n.isRead = n.readBy?.some((r) => r.userId.toString() === userId) || false;
  delete n.readBy;
  return n;
}

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
        Notification.find(filter).sort({ createdAt: -1 }).lean(),
        pagination
      ),
      Notification.countDocuments(filter),
    ]);

    const sanitized = notifications.map((n) => sanitize(n, req.user.userId));
    return paginated(res, sanitized, buildMeta(total, pagination));
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

    // Already read – do nothing
    if (notification.readBy.some((r) => r.userId.toString() === userId)) {
      return success(res, { message: 'Already marked as read' });
    }

    notification.readBy.push({ userId, readAt: new Date() });
    await notification.save();
    return success(res, { message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const unread = await Notification.find({
      recipientIds: userId,
      'readBy.userId': { $ne: userId },
    });

    if (unread.length === 0) {
      return success(res, { message: 'All already read' });
    }

    const bulkOps = unread.map((n) => ({
      updateOne: {
        filter: { _id: n._id },
        update: { $push: { readBy: { userId, readAt: new Date() } } },
      },
    }));
    await Notification.bulkWrite(bulkOps);
    return success(res, { message: 'All marked as read' });
  } catch (err) {
    next(err);
  }
};

const createNotification = async (req, res, next) => {
  if (req.user.role === ROLES.ORG_ADMIN && req.body.scope === 'admins') {
    return res.status(403).json({ success: false, message: 'Admins cannot send to admins scope' });
  }
  try {
    await notificationService.createNotification(req.body);
    return success(res, { message: 'Notification created' }, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllRead,
  createNotification,
};