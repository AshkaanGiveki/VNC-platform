/**
 * Notification model – stores notifications with scope, recipients, and read status.
 * Supports platform, organization, group, and user scopes.
 * @module models/Notification
 */
const mongoose = require('mongoose');
const { NOTIFICATION_CATEGORIES, NOTIFICATION_SCOPE } = require('../utils/constants');

const readBySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null, // null for platform-level notifications
      index: true,
    },
    scope: {
      type: String,
      enum: Object.values(NOTIFICATION_SCOPE),
      required: true,
    },
    recipientIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one recipient is required',
      },
    },
    category: {
      type: String,
      enum: Object.values(NOTIFICATION_CATEGORIES),
      default: NOTIFICATION_CATEGORIES.INFO,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    body: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    readBy: [readBySchema],
  },
  {
    timestamps: true,
  }
);

// Index to fetch unread notifications for a user
notificationSchema.index({ recipientIds: 1, createdAt: -1 });
// Index for organization-scoped queries
notificationSchema.index({ organizationId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;